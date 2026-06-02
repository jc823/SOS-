import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, staffProcedure, adminProcedure, superAdminProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as webhookService from "./webhooks";
import { syncFromSalesArena, getSalesArenaLiveData } from "./sales-arena-sync";
import { runPredictionEngine } from "./prediction-engine";
import { analyzePatterns } from "./learning-engine";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Custom username/password login
    login: publicProcedure
      .input(z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new Error("Invalid username or password");
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new Error("Invalid username or password");
        }
        // Update last signed in
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        // Create session token using the existing JWT infrastructure
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || '',
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } };
      }),

    // Register with invite code
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100),
        email: z.string().email().optional(),
        inviteCode: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate invite code
        const invite = await db.getInviteByCode(input.inviteCode);
        if (!invite) {
          throw new Error("Invalid invite code");
        }
        if (invite.usedAt) {
          throw new Error("This invite code has already been used");
        }
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          throw new Error("This invite code has expired");
        }
        // Check if username is taken
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new Error("Username is already taken");
        }
        // Hash password and create user
        const passwordHash = await bcrypt.hash(input.password, 12);
        const userId = await db.createUserWithPassword({
          username: input.username,
          passwordHash,
          name: input.name,
          email: input.email,
          role: invite.role,
          shopId: invite.shopId || undefined,
        });
        // Mark invite as used
        await db.markInviteUsed(invite.id, userId);
        // Get the created user for session
        const user = await db.getUserById(userId);
        if (!user) throw new Error("Failed to create user");
        // Auto-login: create session
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || '',
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } };
      }),

    // Magic link: generate token, log URL (wire email service later)
    sendMagicLink: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // Don't reveal whether email exists
          return { success: true };
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await db.setMagicLinkToken(user.id, token, expiry);
        const link = `${process.env.APP_URL ?? 'http://localhost:5173'}/login?magic=${token}`;
        console.log(`[MagicLink] Login link for ${input.email}: ${link}`);
        // TODO: send link via email service (Resend, SendGrid, etc.)
        return { success: true };
      }),

    // Magic link: verify token, create session
    verifyMagicLink: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByMagicToken(input.token);
        if (!user || !user.magicLinkExpiry || new Date(user.magicLinkExpiry) < new Date()) {
          throw new Error('Invalid or expired magic link');
        }
        await db.clearMagicLinkToken(user.id);
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || '',
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, role: user.role } };
      }),

    // Validate invite code (public — for the register form)
    validateInvite: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const invite = await db.getInviteByCode(input.code);
        if (!invite) return { valid: false, reason: 'Invalid invite code' };
        if (invite.usedAt) return { valid: false, reason: 'This invite code has already been used' };
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return { valid: false, reason: 'This invite code has expired' };
        return { valid: true, role: invite.role, shopId: invite.shopId || undefined };
      }),
  }),

  // ─── Invites (admin only) ───
  invites: router({
    list: adminProcedure.query(async () => {
      return db.getInvites();
    }),

    create: adminProcedure
      .input(z.object({
        role: z.enum(['user', 'admin', 'super_admin', 'customer']).optional(),
        shopId: z.number().optional(), // For customer invites: link to specific shop
        expiresInDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const code = crypto.randomBytes(16).toString('hex');
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined;
        const id = await db.createInvite({
          code,
          createdById: ctx.user.id,
          role: input.role,
          shopId: input.role === 'customer' ? input.shopId : undefined,
          expiresAt,
        });
        return { id, code };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInvite(input.id);
        return { success: true };
      }),
  }),

  // ─── Shops ───
  shops: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Customers only see their own shop
      if (ctx.user?.role === 'customer' && ctx.user.shopId) {
        const shop = await db.getShopById(ctx.user.shopId);
        return shop ? [shop] : [];
      }
      return db.getShops();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        // Customers can only view their own shop
        if (ctx.user?.role === 'customer' && ctx.user.shopId && input.id !== ctx.user.shopId) {
          throw new Error('Access denied');
        }
        return db.getShopById(input.id);
      }),

    history: protectedProcedure
      .input(z.object({ shopId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role === 'customer' && ctx.user.shopId && input.shopId !== ctx.user.shopId) {
          throw new Error('Access denied');
        }
        return db.getShopAssessments(input.shopId);
      }),

    timeline: protectedProcedure
      .input(z.object({ shopId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role === 'customer' && ctx.user.shopId && input.shopId !== ctx.user.shopId) {
          throw new Error('Access denied');
        }
        const assessments = await db.getShopTimeline(input.shopId);
        const shop = await db.getShopById(input.shopId);
        return { assessments, shopName: shop?.name ?? 'Unknown Shop' };
      }),

    dueForReassessment: staffProcedure
      .input(z.object({ daysThreshold: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getDueForReassessment(input?.daysThreshold ?? 60);
      }),

    uploadLogo: staffProcedure
      .input(z.object({
        shopId: z.number(),
        // Base64-encoded image data
        imageData: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageData, 'base64');
        const ext = input.fileName.split('.').pop() || 'png';
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const fileKey = `shop-logos/${input.shopId}-${randomSuffix}.${ext}`;
        const url = await storagePut(fileKey, buffer, input.mimeType);
        await db.updateShopLogo(input.shopId, url);
        return { logoUrl: url };
      }),

    getLogoByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const shop = await db.getShopByName(input.name);
        return { logoUrl: shop?.logoUrl ?? null };
      }),

    // Get the latest business profile for a shop (for pre-filling on reassessment)
    getLatestBusinessProfile: staffProcedure
      .input(z.object({ shopId: z.number() }))
      .query(async ({ input }) => {
        const profile = await db.getLatestBusinessProfile(input.shopId);
        return profile;
      }),

    // List all shops with their latest assessment data (for shop dropdown)
    listWithAssessments: staffProcedure.query(async () => {
      return db.getShopsWithLatestAssessment();
    }),
  }),

  // ─── Assessments ───
  assessments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Customers only see their own shop's assessments
      if (ctx.user?.role === 'customer' && ctx.user.shopId) {
        return db.getAssessmentsByShop(ctx.user.shopId);
      }
      return db.getAssessments(100);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await db.getAssessmentById(input.id);
        // Customers can only view their own shop's assessments
        if (ctx.user?.role === 'customer' && ctx.user.shopId && result?.assessment?.shopId !== ctx.user.shopId) {
          throw new Error('Access denied');
        }
        return result;
      }),

    create: staffProcedure
      .input(z.object({
        shopName: z.string().min(1),
        assessorName: z.string().min(1),
        assessmentType: z.enum(['assessment', 'consultation']).optional(),
        assessmentDate: z.string(),
        revenueTier: z.string(),
        customTarget: z.number().optional(),
        notes: z.string().optional(),
        scores: z.record(z.string(), z.object({ score: z.number(), note: z.string() })),
        // Pre-computed results from client
        overallPercentage: z.number(),
        overallBand: z.string(),
        scalingProbability: z.number(),
        pillarResults: z.any(),
        bottlenecks: z.any(),
        topLeveragePriorities: z.any(),
        actionPlan: z.any().optional(),
        // Revenue data
        currentRevenue: z.number().optional(), // Current monthly revenue
        goalRevenue: z.number().optional(), // Target monthly revenue goal
        // Business profile snapshot
        businessProfile: z.any().optional(),
        // Reassessment tracking
        previousAssessmentId: z.number().optional(),
        actualRevenue: z.number().optional(), // Actual monthly revenue at time of reassessment
      }))
      .mutation(async ({ ctx, input }) => {
        // Find or create the shop
        const shopId = await db.findOrCreateShop(input.shopName, ctx.user.id);

        const assessmentId = await db.createAssessment({
          shopId,
          assessorId: ctx.user.id,
          assessorName: input.assessorName,
          assessmentType: input.assessmentType ?? 'assessment',
          assessmentDate: input.assessmentDate,
          revenueTier: input.revenueTier,
          customTarget: input.customTarget ?? null,
          notes: input.notes ?? null,
          overallPercentage: input.overallPercentage,
          overallBand: input.overallBand,
          scalingProbability: input.scalingProbability,
          scores: input.scores,
          pillarResults: input.pillarResults,
          bottlenecks: input.bottlenecks,
          topLeveragePriorities: input.topLeveragePriorities,
          actionPlan: input.actionPlan ?? null,
          currentRevenue: input.currentRevenue ?? null,
          goalRevenue: input.goalRevenue ?? null,
          businessProfile: input.businessProfile ?? null,
          previousAssessmentId: input.previousAssessmentId ?? null,
          actualRevenue: input.actualRevenue ?? null,
        });

        // Fire prediction engine in background — don't block the response
        runPredictionEngine(assessmentId).catch(err => console.error("[Prediction Engine]", err));

        return { id: assessmentId, shopId };
      }),

    // Delete assessment (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAssessment(input.id);
        return { success: true };
      }),

    // Send assessment to customer portal — creates/links customer account by email
    sendToCustomer: staffProcedure
      .input(z.object({
        assessmentId: z.number(),
        shopId: z.number(),
        customerEmail: z.string().email(),
        customerName: z.string().min(1),
        origin: z.string(), // frontend origin for building portal URL
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if customer already exists with this email
        const existingUser = await db.getUserByEmail(input.customerEmail);

        if (existingUser && existingUser.role === 'customer' && existingUser.shopId === input.shopId) {
          // Customer already exists and is linked to this shop — just notify
          return {
            status: 'existing' as const,
            message: `${input.customerEmail} already has access to this shop's portal.`,
            portalUrl: `${input.origin}/login`,
            username: existingUser.username || existingUser.email,
            password: null, // Don't expose existing password
          };
        }

        if (existingUser && existingUser.role === 'customer' && existingUser.shopId !== input.shopId) {
          // Customer exists but linked to a different shop
          return {
            status: 'error' as const,
            message: `This email is already associated with a different shop. Please use a different email.`,
            portalUrl: null,
            username: null,
            password: null,
          };
        }

        // Generate a secure random password (readable format)
        const generatePassword = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
          let pw = '';
          for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
          return pw;
        };
        const tempPassword = generatePassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Use email as username (strip @ and domain for cleaner username)
        const username = input.customerEmail.toLowerCase();

        // Check if username is taken (by a non-customer)
        const existingUsername = await db.getUserByUsername(username);
        if (existingUsername) {
          // Username conflict — append random suffix
          const suffix = Math.random().toString(36).slice(2, 6);
          const altUsername = `${username.split('@')[0]}_${suffix}`;
          const userId = await db.createUserWithPassword({
            username: altUsername,
            passwordHash,
            name: input.customerName,
            email: input.customerEmail,
            role: 'customer',
            shopId: input.shopId,
          });

          // Create a corresponding invite record for audit trail
          const inviteCode = crypto.randomBytes(16).toString('hex');
          const inviteId = await db.createInvite({
            code: inviteCode,
            createdById: ctx.user.id,
            role: 'customer',
            shopId: input.shopId,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
          await db.markInviteUsed(inviteId, userId);

          // Notify owner about new customer access
          try {
            const { notifyOwner } = await import('./_core/notification');
            await notifyOwner({
              title: `New Customer Portal Access: ${input.customerName}`,
              content: `A customer portal account was created for ${input.customerName} (${input.customerEmail}) linked to shop #${input.shopId}. They can now view their assessment reports at ${input.origin}/login`,
            });
          } catch (e) {
            console.warn('[SendToCustomer] Notification failed:', e);
          }

          return {
            status: 'created' as const,
            message: `Customer account created for ${input.customerEmail}`,
            portalUrl: `${input.origin}/login`,
            username: altUsername,
            password: tempPassword,
          };
        }

        // Create customer account
        const userId = await db.createUserWithPassword({
          username,
          passwordHash,
          name: input.customerName,
          email: input.customerEmail,
          role: 'customer',
          shopId: input.shopId,
        });

        // Notify owner about new customer access
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `New Customer Portal Access: ${input.customerName}`,
            content: `A customer portal account was created for ${input.customerName} (${input.customerEmail}) linked to shop #${input.shopId}. They can now view their assessment reports at ${input.origin}/login`,
          });
        } catch (e) {
          console.warn('[SendToCustomer] Notification failed:', e);
        }

        return {
          status: 'created' as const,
          message: `Customer account created for ${input.customerEmail}`,
          portalUrl: `${input.origin}/login`,
          username,
          password: tempPassword,
        };
      }),

    // Get previous assessment for comparison (for reassessment context)
    getPrevious: protectedProcedure
      .input(z.object({ assessmentId: z.number(), shopId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Customers can only get previous for their own shop
        if (ctx.user?.role === 'customer' && ctx.user.shopId && input.shopId !== ctx.user.shopId) {
          throw new Error('Access denied');
        }
        const prev = await db.getPreviousAssessment(input.shopId, input.assessmentId);
        if (!prev) return null;
        return {
          id: prev.id,
          assessmentDate: prev.assessmentDate,
          overallPercentage: prev.overallPercentage,
          overallBand: prev.overallBand,
          scalingProbability: prev.scalingProbability,
          revenueTier: prev.revenueTier,
          scores: prev.scores as Record<string, { score: number; note: string }>,
          pillarResults: prev.pillarResults as any[],
        };
      }),

    // Compare two assessments
    compare: protectedProcedure
      .input(z.object({ assessmentIdA: z.number(), assessmentIdB: z.number() }))
      .query(async ({ ctx, input }) => {
        const [a, b] = await Promise.all([
          db.getAssessmentById(input.assessmentIdA),
          db.getAssessmentById(input.assessmentIdB),
        ]);
        if (!a || !b) throw new Error("One or both assessments not found");
        // Customers can only compare their own shop's assessments
        if (ctx.user?.role === 'customer' && ctx.user.shopId) {
          if (a.assessment.shopId !== ctx.user.shopId || b.assessment.shopId !== ctx.user.shopId) {
            throw new Error('Access denied');
          }
        }

        const aScores = a.assessment.scores as Record<string, { score: number; note: string }>;
        const bScores = b.assessment.scores as Record<string, { score: number; note: string }>;
        const aPillars = a.assessment.pillarResults as any[];
        const bPillars = b.assessment.pillarResults as any[];

        // Compute deltas
        const pillarDeltas = aPillars.map((ap: any) => {
          const bp = bPillars.find((p: any) => p.id === ap.id);
          return {
            pillarId: ap.id,
            label: ap.label,
            percentageA: ap.percentage,
            percentageB: bp?.percentage ?? 0,
            delta: (bp?.percentage ?? 0) - ap.percentage,
          };
        });

        // Subcategory deltas
        const allSubIds = new Set([...Object.keys(aScores), ...Object.keys(bScores)]);
        const subcategoryDeltas = Array.from(allSubIds).map(id => {
          const scoreA = aScores[id]?.score ?? 0;
          const scoreB = bScores[id]?.score ?? 0;
          return { id, scoreA, scoreB, delta: scoreB - scoreA };
        });

        const improved = subcategoryDeltas.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta);
        const regressed = subcategoryDeltas.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta);
        const unchanged = subcategoryDeltas.filter(d => d.delta === 0);

        return {
          assessmentA: {
            id: a.assessment.id,
            shopName: a.shopName,
            date: a.assessment.assessmentDate,
            overallPercentage: a.assessment.overallPercentage,
            scalingProbability: a.assessment.scalingProbability,
            pillarResults: aPillars,
          },
          assessmentB: {
            id: b.assessment.id,
            shopName: b.shopName,
            date: b.assessment.assessmentDate,
            overallPercentage: b.assessment.overallPercentage,
            scalingProbability: b.assessment.scalingProbability,
            pillarResults: bPillars,
          },
          changes: {
            overallDelta: b.assessment.overallPercentage - a.assessment.overallPercentage,
            probabilityDelta: b.assessment.scalingProbability - a.assessment.scalingProbability,
            pillarDeltas,
            improved,
            regressed,
            unchanged,
          },
        };
      }),
    // Get averaged assessment for a shop within a time window
    getAveraged: staffProcedure
      .input(z.object({ shopId: z.number(), windowDays: z.number().optional() }))
      .query(async ({ input }) => {
        const { averageAssessments, groupAssessmentsByWindow } = await import('@shared/averaging');
        const assessments = await db.getShopAssessments(input.shopId);
        if (!assessments || assessments.length === 0) return null;

        // Convert to the format needed for averaging
        const forAveraging = assessments.map((a: any) => ({
          id: a.id,
          assessorName: a.assessorName,
          assessorId: a.assessorId,
          assessmentDate: a.assessmentDate,
          overallPercentage: a.overallPercentage,
          scalingProbability: a.scalingProbability,
          scores: (typeof a.scores === 'string' ? JSON.parse(a.scores) : a.scores) || {},
          businessProfile: a.businessProfile,
          currentRevenue: a.currentRevenue,
        }));

        // Group by 5-day windows
        const groups = groupAssessmentsByWindow(forAveraging, input.windowDays ?? 5);

        // Return the latest group's averaged result
        const latestGroup = groups[groups.length - 1];
        if (!latestGroup || latestGroup.length === 0) return null;

        const averaged = averageAssessments(latestGroup);
        return averaged;
      }),
  }),

  // ─── Outcomes ───
  outcomes: router({
    create: staffProcedure
      .input(z.object({
        assessmentId: z.number(),
        shopId: z.number(),
        hitTarget: z.enum(["yes", "no", "partial", "unknown"]),
        actualRevenue: z.number().optional(),
        monthsElapsed: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createOutcome({
          assessmentId: input.assessmentId,
          shopId: input.shopId,
          hitTarget: input.hitTarget,
          actualRevenue: input.actualRevenue ?? null,
          monthsElapsed: input.monthsElapsed ?? null,
          notes: input.notes ?? null,
          loggedById: ctx.user.id,
        });
        return { id };
      }),

    getByAssessment: staffProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getOutcomesByAssessment(input.assessmentId);
      }),
  }),

  // ─── Learning Engine ───
  learning: router({
    stats: staffProcedure.query(async () => {
      const stats = await db.getLearningStats();
      const adjustments = await db.getLatestAdjustments(10);

      // Generate insights based on data
      const insights: string[] = [];
      if (stats.totalAssessments === 0) {
        insights.push("No assessments yet. Start scoring shops to build the learning dataset.");
      } else if (stats.totalOutcomes === 0) {
        insights.push(`${stats.totalAssessments} assessments recorded. Log outcomes to enable algorithm learning.`);
      } else {
        const hitRate = stats.totalOutcomes > 0 ? "Outcome data is being collected." : "";
        insights.push(`${stats.totalAssessments} assessments, ${stats.totalOutcomes} outcomes tracked. ${hitRate}`);
        if (stats.totalOutcomes >= 5) {
          insights.push("Enough data for initial pattern recognition. Recalibration available.");
        }
        if (stats.totalOutcomes >= 20) {
          insights.push("Strong dataset. Algorithm adjustments have high confidence.");
        }
      }

      return { ...stats, insights, recentAdjustments: adjustments };
    }),

    recalibrate: staffProcedure.mutation(async () => {
      // Get all outcomes with their assessment data
      const outcomesData = await db.getAllOutcomesWithAssessments();
      if (outcomesData.length < 3) {
        return { success: false, message: "Need at least 3 outcomes to recalibrate." };
      }

      // Analyze patterns using LLM
      const analysisData = outcomesData.map(o => ({
        overallPercentage: o.assessment?.overallPercentage,
        scalingProbability: o.assessment?.scalingProbability,
        revenueTier: o.assessment?.revenueTier,
        hitTarget: o.outcome.hitTarget,
        actualRevenue: o.outcome.actualRevenue,
        monthsElapsed: o.outcome.monthsElapsed,
        pillarResults: o.assessment?.pillarResults,
      }));

      try {
        const llmResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an algorithm calibration engine for a business assessment tool (SOS Assessment, part of Scale Toolkit) used for auto detailing shops. Analyze the outcome data and suggest probability curve adjustments. Return JSON only.`,
            },
            {
              role: "user",
              content: `Analyze these assessment outcomes and suggest adjustments to the probability algorithm:

${JSON.stringify(analysisData, null, 2)}

Return a JSON object with:
{
  "adjustments": [
    {
      "type": "threshold_adjust" | "weight_shift" | "pattern_found",
      "pillarId": "services|sales|ads|team" or null,
      "description": "what was found",
      "previousValue": number or null,
      "newValue": number or null,
      "confidence": 0-1
    }
  ],
  "summary": "brief summary of findings"
}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = typeof llmResult.choices[0]?.message?.content === 'string'
          ? llmResult.choices[0].message.content
          : '';
        const parsed = JSON.parse(content);

        // Store adjustments
        for (const adj of (parsed.adjustments || [])) {
          await db.createAlgorithmAdjustment({
            adjustmentType: adj.type || 'pattern_found',
            pillarId: adj.pillarId || null,
            subcategoryId: null,
            previousValue: adj.previousValue ?? null,
            newValue: adj.newValue ?? null,
            confidence: adj.confidence ?? 0.5,
            sampleSize: outcomesData.length,
            description: adj.description || null,
            payload: adj,
          });
        }

        return { success: true, message: parsed.summary || "Recalibration complete.", adjustments: parsed.adjustments?.length || 0 };
      } catch (error) {
        console.error("[Learning] Recalibration failed:", error);
        return { success: false, message: "Recalibration failed. Will retry with more data." };
      }
    }),
  }),

  // ─── Prescriptive Action Plan ───
  actionPlan: router({
    generate: staffProcedure
      .input(z.object({
        scores: z.record(z.string(), z.object({ score: z.number(), note: z.string() })),
        revenueTier: z.string(),
        overallPercentage: z.number(),
        scalingProbability: z.number(),
        shopName: z.string(),
        assessmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const scoresEntries = Object.entries(input.scores) as [string, { score: number; note: string }][];
          const weakAreas = scoresEntries.filter(([, s]) => s.score <= 2).map(([id, s]) => `${id}: ${s.score}/5`);
          const strongAreas = scoresEntries.filter(([, s]) => s.score >= 4).map(([id, s]) => `${id}: ${s.score}/5`);

          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a senior business growth consultant specializing in the auto detailing industry, working for Scale Detailing — a consulting firm that helps detailing shops scale from $20k to $50k+/month.

You have deep knowledge of:
- SERVICE OPERATIONS: Paint correction, ceramic coatings, PPF installation, interior detailing, maintenance washes. You understand that service quality and consistency are the foundation — shops can't scale with inconsistent output.
- SALES SYSTEMS: Booking flows, CRM usage, follow-up sequences, upsell strategies, phone/text scripts, estimate-to-close ratios. Most shops leave 30-40% of revenue on the table from poor follow-up alone.
- ADVERTISING & MARKETING: Google Ads, Meta Ads (Facebook/Instagram), Google Business Profile optimization, review generation, referral programs, local SEO. The #1 mistake shops make is spending on ads before their sales process can convert the leads.
- TEAM & OPERATIONS: Hiring detailers, training programs, SOPs, quality control checklists, compensation structures, team culture. Scaling past $30k/mo almost always requires building a team beyond the owner.

Key Scale Detailing principles:
1. Fix the SALES PROCESS before increasing ad spend — leads are expensive, don't waste them
2. Systemize before you scale — SOPs, checklists, and training must exist before adding team members
3. Revenue per ticket matters more than volume — focus on average ticket value through proper upselling
4. Google Business Profile is the highest-ROI marketing channel for local detailing shops
5. Ceramic coating and PPF are the highest-margin services — shops should be pushing these
6. Phone skills and speed-to-lead are the #1 controllable factor in conversion rates
7. Most shops plateau at $25-30k because the owner is still doing all the work — delegation is key

Return JSON only. Be extremely specific and actionable — no generic advice like "improve marketing." Give exact steps like "Set up a 3-text follow-up sequence for unconverted estimates: Day 1, Day 3, Day 7."`,
              },
              {
                role: "user",
                content: `Shop: ${input.shopName}
Revenue Goal: ${input.revenueTier === 'custom' ? 'Custom' : '$' + input.revenueTier.replace('-', 'k-$') + 'k/mo'}
Current SOS Score: ${input.overallPercentage.toFixed(1)}%
Scaling Probability: ${input.scalingProbability.toFixed(1)}%

All Scores (0-5 scale):
${scoresEntries.map(([id, s]) => `  ${id}: ${s.score}/5${s.note ? ' — Note: ' + s.note : ''}`).join('\n')}

Weakest Areas (score ≤ 2): ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None'}
Strongest Areas (score ≥ 4): ${strongAreas.length > 0 ? strongAreas.join(', ') : 'None'}

Generate a 90-day action plan with the top 8 highest-impact improvements. Prioritize by:
1. Quick wins that can show revenue impact in 2-4 weeks
2. Foundation fixes that enable future growth
3. Growth accelerators for when the foundation is solid

For each item, provide:
- The subcategory ID (must match one of the scored IDs above)
- Current score and realistic 90-day target score
- 2-3 specific, actionable steps (not generic advice)
- Estimated probability gain toward their revenue goal
- A brief rationale explaining WHY this matters for their specific situation
- A priority tier: "immediate" (week 1-2), "short-term" (week 3-6), or "medium-term" (week 7-12)

Return JSON:
{
  "plan": [
    {
      "subcategoryId": "string",
      "currentScore": number,
      "targetScore": number,
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "estimatedProbabilityGain": number,
      "rationale": "why this matters for this specific shop",
      "priority": "immediate" | "short-term" | "medium-term"
    }
  ],
  "summary": "2-3 sentence executive summary of the biggest opportunities and expected impact",
  "quickWins": ["1-2 sentence quick win that can show results this week", "another quick win"],
  "biggestBottleneck": "The single biggest thing holding this shop back from their revenue goal"
}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const content = typeof llmResult.choices[0]?.message?.content === 'string'
            ? llmResult.choices[0].message.content
            : '{}';
          const parsed = JSON.parse(content);

          // If assessmentId provided, store the action plan with the assessment
          if (input.assessmentId) {
            try {
              await db.updateAssessmentActionPlan(input.assessmentId, parsed);
            } catch (e) {
              console.error('[ActionPlan] Failed to store with assessment:', e);
            }
          }

          return parsed;
        } catch (error) {
          console.error("[ActionPlan] Generation failed:", error);
          return { plan: [], summary: "Unable to generate action plan at this time.", quickWins: [], biggestBottleneck: "" };
        }
      }),

    // 30-Day Battle Plan — focused, week-by-week tactical plan
    generateBattlePlan: staffProcedure
      .input(z.object({
        scores: z.record(z.string(), z.object({ score: z.number(), note: z.string() })),
        revenueTier: z.string(),
        overallPercentage: z.number(),
        scalingProbability: z.number(),
        shopName: z.string(),
        currentRevenue: z.number().optional(),
        goalRevenue: z.number().optional(),
        businessProfile: z.any().optional(),
        assessmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const scoresEntries = Object.entries(input.scores) as [string, { score: number; note: string }][];
          const weakAreas = scoresEntries.filter(([, s]) => s.score <= 2).map(([id, s]) => `${id}: ${s.score}/5${s.note ? ' — ' + s.note : ''}`);
          const criticalAreas = scoresEntries.filter(([, s]) => s.score <= 1).map(([id, s]) => `${id}: ${s.score}/5`);

          // Build business context from profile
          let profileContext = '';
          if (input.businessProfile) {
            const bp = input.businessProfile;
            if (bp.yearsInBusiness) profileContext += `Years in business: ${bp.yearsInBusiness}\n`;
            if (bp.facilityType?.length) profileContext += `Facility: ${bp.facilityType.join(', ')}\n`;
            if (bp.serviceFocus?.length) profileContext += `Services: ${bp.serviceFocus.join(', ')}\n`;
            if (bp.averageTicketSize) profileContext += `Avg ticket: $${bp.averageTicketSize}\n`;
            if (bp.repeatRate?.known && bp.repeatRate?.percentage != null) profileContext += `Repeat rate: ${bp.repeatRate.percentage}%\n`;
            if (bp.adSpend) {
              const totalAd = Object.values(bp.adSpend).reduce((s: number, v: any) => s + (v || 0), 0);
              if (totalAd > 0) profileContext += `Monthly ad spend: $${totalAd}\n`;
            }
            if (bp.employees) {
              const totalEmp = Object.values(bp.employees).reduce((s: number, v: any) => s + ((v as any)?.count || 0), 0);
              if (totalEmp > 0) profileContext += `Team size: ${totalEmp}\n`;
            }
          }

          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a senior business growth consultant for Scale Detailing — a consulting firm that helps auto detailing shops scale revenue.

You create TACTICAL 30-day battle plans. Not vague advice — specific daily and weekly tasks that a shop owner can execute immediately.

Key principles:
1. Week 1 is about QUICK WINS — things that generate revenue within 7 days
2. Week 2 is about SYSTEMS — setting up processes that compound
3. Week 3 is about GROWTH — turning on lead generation with a working sales process
4. Week 4 is about OPTIMIZATION — measuring, adjusting, and planning the next 30 days

Be extremely specific. Instead of "improve follow-up", say "Set up 3-text sequence in your CRM: Day 0 (within 5 min of inquiry), Day 1 (value-add with before/after photo), Day 3 (limited-time offer). Template: [exact template]."

Return JSON only.`,
              },
              {
                role: "user",
                content: `Shop: ${input.shopName}
Current Revenue: ${input.currentRevenue ? '$' + input.currentRevenue.toLocaleString() + '/mo' : 'Unknown'}
Goal Revenue: ${input.goalRevenue ? '$' + input.goalRevenue.toLocaleString() + '/mo' : input.revenueTier}
SOS Score: ${input.overallPercentage.toFixed(1)}%
Scaling Probability: ${input.scalingProbability.toFixed(1)}%
${profileContext ? '\nBusiness Profile:\n' + profileContext : ''}

Weakest Areas (need immediate attention):
${weakAreas.length > 0 ? weakAreas.join('\n') : 'None critical'}

Critical Areas (score 0-1):
${criticalAreas.length > 0 ? criticalAreas.join('\n') : 'None'}

All Scores:
${scoresEntries.map(([id, s]) => `  ${id}: ${s.score}/5${s.note ? ' — ' + s.note : ''}`).join('\n')}

Generate a 30-DAY BATTLE PLAN with 4 weeks of specific tasks. Each week should have 3-5 concrete action items.

Return JSON:
{
  "battlePlanTitle": "30-Day Battle Plan for [Shop Name]",
  "executiveSummary": "2-3 sentences: what this plan will accomplish and expected revenue impact",
  "expectedRevenueImpact": "$X,XXX estimated monthly revenue increase by Day 30",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Quick Wins & Revenue Recovery",
      "goal": "One-sentence goal for this week",
      "tasks": [
        {
          "day": "Day 1-2",
          "title": "Short task title",
          "description": "Detailed step-by-step instructions. Be VERY specific.",
          "expectedImpact": "What this will achieve (e.g., 'Recover 3-5 lost leads worth $1,500-2,500')",
          "relatedArea": "subcategory ID this relates to"
        }
      ],
      "weeklyMilestone": "What should be true by end of this week"
    }
  ],
  "thirtyDayTarget": "Specific measurable goal for Day 30 (e.g., 'Revenue run rate of $X/mo with Y new customers')",
  "keyMetricsToTrack": ["metric 1", "metric 2", "metric 3"]
}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const content = typeof llmResult.choices[0]?.message?.content === 'string'
            ? llmResult.choices[0].message.content
            : '{}';
          const parsed = JSON.parse(content);

          // Store battle plan with assessment if ID provided
          if (input.assessmentId) {
            try {
              const existing = await db.getAssessmentById(input.assessmentId);
              const existingPlan = (existing?.assessment?.actionPlan as any) || {};
              await db.updateAssessmentActionPlan(input.assessmentId, {
                ...existingPlan,
                battlePlan: parsed,
              });
            } catch (e) {
              console.error('[BattlePlan] Failed to store:', e);
            }
          }

          return parsed;
        } catch (error) {
          console.error("[BattlePlan] Generation failed:", error);
          return {
            battlePlanTitle: "30-Day Battle Plan",
            executiveSummary: "Unable to generate battle plan at this time.",
            expectedRevenueImpact: "N/A",
            weeks: [],
            thirtyDayTarget: "",
            keyMetricsToTrack: [],
          };
        }
      }),

    // Scale's Playbook — branded AI-powered strategic recommendations
    generateScalePlaybook: staffProcedure
      .input(z.object({
        scores: z.record(z.string(), z.object({ score: z.number(), note: z.string() })),
        revenueTier: z.string(),
        overallPercentage: z.number(),
        scalingProbability: z.number(),
        shopName: z.string(),
        assessmentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const scoresEntries = Object.entries(input.scores) as [string, { score: number; note: string }][];
          const weakAreas = scoresEntries.filter(([, s]) => s.score <= 2).map(([id, s]) => `${id}: ${s.score}/5${s.note ? ' — ' + s.note : ''}`);
          const strongAreas = scoresEntries.filter(([, s]) => s.score >= 4).map(([id, s]) => `${id}: ${s.score}/5`);

          const scoresText = scoresEntries.map(([id, s]) => '  ' + id + ': ' + s.score + '/5' + (s.note ? ' \u2014 Note: ' + s.note : '')).join('\n');
          const revenueGoal = input.revenueTier === 'custom' ? 'Custom' : '$' + input.revenueTier.replace('-', 'k-$') + 'k/mo';

          const systemPrompt = [
            'You are the Chief Strategy Officer at Scale Detailing \u2014 the premier consulting firm that helps auto detailing shops scale from $20k to $50k+/month.',
            '',
            'You create BRANDED STRATEGIC PLAYBOOKS that feel like $10,000 consulting deliverables. Your tone is confident, direct, and authoritative \u2014 like a surgeon explaining exactly what needs to happen.',
            '',
            "Scale Detailing's core methodology:",
            '1. SALES FIRST: Fix the sales process before spending a dollar on ads. Most shops waste 40-60% of their leads due to poor follow-up, slow response times, and no upsell system.',
            '2. SYSTEMIZE BEFORE SCALING: SOPs, checklists, and training must exist before adding team members. Scaling chaos just creates bigger chaos.',
            '3. REVENUE PER TICKET > VOLUME: Focus on average ticket value through proper upselling of ceramic coatings, PPF, and premium packages.',
            '4. GBP IS KING: Google Business Profile is the highest-ROI marketing channel for local detailing shops. Period.',
            '5. SPEED TO LEAD WINS: The shop that responds in 5 minutes gets the job. The shop that responds in 5 hours loses it.',
            '6. DELEGATION IS THE CEILING: Most shops plateau at $25-30k because the owner does everything. Building a team is not optional for growth.',
            '7. CERAMIC & PPF ARE THE MARGIN PLAY: These are the highest-margin services \u2014 shops should be pushing these aggressively.',
            '',
            "Return JSON only. Be extremely specific and prescriptive \u2014 this should read like a doctor's prescription, not generic business advice.",
          ].join('\n');

          const userPrompt = [
            'Shop: ' + input.shopName,
            'Revenue Goal: ' + revenueGoal,
            'Current SOS Score: ' + input.overallPercentage.toFixed(1) + '%',
            'Scaling Probability: ' + input.scalingProbability.toFixed(1) + '%',
            '',
            'All Scores (0-5 scale):',
            scoresText,
            '',
            'Weakest Areas (score <= 2): ' + (weakAreas.length > 0 ? weakAreas.join(', ') : 'None'),
            'Strongest Areas (score >= 4): ' + (strongAreas.length > 0 ? strongAreas.join(', ') : 'None'),
            '',
            "Generate Scale's Strategic Playbook with these sections:",
            '',
            "1. EXECUTIVE DIAGNOSIS: 2-3 sentences. Be direct and specific about what's holding this shop back. Use data from their scores.",
            '',
            '2. TOP 5 PRIORITY MOVES (prescriptions): The 5 most impactful changes, ordered by ROI. For each:',
            '   - A clear, actionable title',
            '   - Detailed description with SPECIFIC steps (not "improve marketing" \u2014 say exactly what to do)',
            '   - Timeframe (e.g., "Week 1-2")',
            '   - Estimated revenue impact (e.g., "+$3,000-5,000/mo")',
            '   - Related subcategory ID',
            '',
            '3. REVENUE TIMELINE: Realistic projections for Day 30, Day 60, Day 90 if they execute the playbook',
            '',
            "4. COST OF WAITING: 1-2 sentences on what they lose every month they don't act. Be specific with dollar amounts.",
            '',
            '5. GUARANTEE STATEMENT: A confident closing statement about what Scale can deliver for this specific shop.',
            '',
            'Return JSON: { "executiveDiagnosis": "string", "prescriptions": [{ "title": "string", "description": "string with specific steps", "timeframe": "string", "revenueImpact": "string", "subcategoryId": "string" }], "revenueTimeline": { "day30": "string", "day60": "string", "day90": "string" }, "costOfWaiting": "string", "guaranteeStatement": "string" }',
          ].join('\n');

          const llmResult = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          });

          const content = typeof llmResult.choices[0]?.message?.content === 'string'
            ? llmResult.choices[0].message.content
            : '{}';
          const parsed = JSON.parse(content);

          // Store playbook with assessment if ID provided
          if (input.assessmentId) {
            try {
              const existing = await db.getAssessmentById(input.assessmentId);
              const existingPlan = (existing?.assessment?.actionPlan as any) || {};
              await db.updateAssessmentActionPlan(input.assessmentId, {
                ...existingPlan,
                scalePlaybook: parsed,
              });
            } catch (e) {
              console.error('[ScalePlaybook] Failed to store:', e);
            }
          }

          return parsed;
        } catch (error) {
          console.error("[ScalePlaybook] Generation failed:", error);
          return {
            executiveDiagnosis: "Unable to generate playbook at this time.",
            prescriptions: [],
            revenueTimeline: { day30: "N/A", day60: "N/A", day90: "N/A" },
            costOfWaiting: "",
            guaranteeStatement: "",
          };
        }
      }),
  }),

  // ─── Webhooks (admin only — infrastructure ready, dormant) ───
  webhooks: router({
    list: adminProcedure.query(async () => {
      return webhookService.getWebhooks();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const wh = await webhookService.getWebhookById(input.id);
        if (!wh) throw new Error('Webhook not found');
        // Also get recent deliveries
        const deliveries = await webhookService.getWebhookDeliveries(input.id, 20);
        return { webhook: wh, deliveries };
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        url: z.string().url(),
        secret: z.string().optional(),
        events: z.array(z.string()).min(1),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await webhookService.createWebhook({
          name: input.name,
          url: input.url,
          secret: input.secret,
          events: input.events,
          active: input.active ?? false,
          createdById: ctx.user.id,
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        secret: z.string().optional(),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await webhookService.updateWebhook(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await webhookService.deleteWebhook(input.id);
        return { success: true };
      }),

    // Test a webhook by sending a ping event
    test: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const wh = await webhookService.getWebhookById(input.id);
        if (!wh) throw new Error('Webhook not found');
        // Temporarily dispatch even if inactive
        await webhookService.dispatchWebhookEvent('assessment.created' as any, {
          test: true,
          message: 'This is a test webhook delivery from Scale Toolkit',
          timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Test event dispatched' };
      }),
   }),

  // ─── Prediction Accuracy ───
  predictions: router({
    // Get all prediction data for the accuracy dashboard
    accuracy: staffProcedure.query(async () => {
      const [reassessments, outcomesData, stats] = await Promise.all([
        db.getReassessmentsWithActualRevenue(),
        db.getAssessmentsWithOutcomes(),
        db.getPredictionStats(),
      ]);

      // Process reassessment data: compare predicted probability vs actual revenue achievement
      const predictionPoints = (reassessments as any[]).map((r: any) => {
        const prevGoal = r.prevGoalRevenue || 0;
        const actual = r.actualRevenue || 0;
        const prevProbability = r.prevProbability || 0;
        // Achievement ratio: how close did they get to their goal?
        const achievementRatio = prevGoal > 0 ? Math.min(actual / prevGoal, 1.5) : 0;
        // Did they hit the target? (within 10% counts as hit)
        const hitTarget = prevGoal > 0 && actual >= prevGoal * 0.9;
        // Revenue change from previous assessment
        const prevRevenue = r.prevCurrentRevenue || 0;
        const revenueChange = actual - prevRevenue;
        const revenueChangePercent = prevRevenue > 0 ? ((actual - prevRevenue) / prevRevenue) * 100 : 0;

        return {
          reassessmentId: r.reassessmentId,
          shopId: r.shopId,
          shopName: r.shopName,
          prevAssessmentDate: r.prevAssessmentDate,
          reassessmentDate: r.reassessmentDate,
          prevProbability: Math.round(prevProbability * 100) / 100,
          prevPercentage: r.prevPercentage,
          newPercentage: r.newPercentage,
          prevRevenueTier: r.prevRevenueTier,
          prevCurrentRevenue: prevRevenue,
          prevGoalRevenue: prevGoal,
          actualRevenue: actual,
          achievementRatio: Math.round(achievementRatio * 100) / 100,
          hitTarget,
          revenueChange,
          revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
          scoreChange: r.newPercentage - r.prevPercentage,
        };
      });

      // Process outcome data
      const outcomePoints = (outcomesData as any[]).map((o: any) => ({
        assessmentId: o.assessmentId,
        shopId: o.shopId,
        shopName: o.shopName,
        assessmentDate: o.assessmentDate,
        probability: o.scalingProbability,
        overallPercentage: o.overallPercentage,
        revenueTier: o.revenueTier,
        currentRevenue: o.currentRevenue,
        goalRevenue: o.goalRevenue,
        hitTarget: o.hitTarget,
        outcomeRevenue: o.outcomeRevenue,
        monthsElapsed: o.monthsElapsed,
        outcomeNotes: o.outcomeNotes,
      }));

      // Calculate calibration buckets (group predictions by probability range)
      const calibrationBuckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(lower => {
        const upper = lower + 10;
        const inBucket = predictionPoints.filter(p => {
          const prob = p.prevProbability;
          return prob >= lower && prob < upper;
        });
        const total = inBucket.length;
        const hits = inBucket.filter(p => p.hitTarget).length;
        return {
          range: `${lower}-${upper}%`,
          lower,
          upper,
          total,
          hits,
          actualRate: total > 0 ? Math.round((hits / total) * 100) : null,
          expectedRate: lower + 5, // midpoint of bucket
        };
      });

      // Calculate per-tier accuracy
      const tierGroups: Record<string, typeof predictionPoints> = {};
      for (const p of predictionPoints) {
        const tier = p.prevRevenueTier || 'unknown';
        if (!tierGroups[tier]) tierGroups[tier] = [];
        tierGroups[tier].push(p);
      }
      const tierAccuracy = Object.entries(tierGroups).map(([tier, points]) => {
        const hits = points.filter(p => p.hitTarget).length;
        const avgProbability = points.reduce((s, p) => s + p.prevProbability, 0) / points.length;
        const avgAchievement = points.reduce((s, p) => s + p.achievementRatio, 0) / points.length;
        return {
          tier,
          total: points.length,
          hits,
          hitRate: Math.round((hits / points.length) * 100),
          avgProbability: Math.round(avgProbability * 10) / 10,
          avgAchievement: Math.round(avgAchievement * 100),
        };
      });

      // Overall accuracy metrics
      const totalWithData = predictionPoints.length;
      const totalHits = predictionPoints.filter(p => p.hitTarget).length;
      const overallHitRate = totalWithData > 0 ? Math.round((totalHits / totalWithData) * 100) : 0;
      const avgPredictedProb = totalWithData > 0
        ? Math.round(predictionPoints.reduce((s, p) => s + p.prevProbability, 0) / totalWithData * 10) / 10
        : 0;
      const avgActualAchievement = totalWithData > 0
        ? Math.round(predictionPoints.reduce((s, p) => s + p.achievementRatio, 0) / totalWithData * 100)
        : 0;
      // Calibration error: average absolute difference between predicted probability and actual hit rate
      const calibrationError = calibrationBuckets
        .filter(b => b.total > 0 && b.actualRate !== null)
        .reduce((sum, b) => sum + Math.abs((b.actualRate || 0) - b.expectedRate), 0) /
        Math.max(calibrationBuckets.filter(b => b.total > 0).length, 1);

      // Average revenue growth across all reassessments
      const avgRevenueGrowth = totalWithData > 0
        ? Math.round(predictionPoints.reduce((s, p) => s + p.revenueChangePercent, 0) / totalWithData * 10) / 10
        : 0;

      return {
        summary: {
          totalAssessments: stats.totalPredictions,
          totalWithOutcomes: stats.totalWithOutcomes,
          totalReassessments: totalWithData,
          overallHitRate,
          avgPredictedProbability: avgPredictedProb,
          avgActualAchievement,
          calibrationError: Math.round(calibrationError * 10) / 10,
          avgRevenueGrowth,
        },
        predictionPoints,
        outcomePoints,
        calibrationBuckets,
        tierAccuracy,
      };
    }),
  }),

  // ─── SEO Toolkit ───
  seo: router({
    // Run automated website audit
    runAudit: staffProcedure
      .input(z.object({
        websiteUrl: z.string().min(1),
        city: z.string().optional(),
        surroundingAreas: z.array(z.string()).optional(),
        customKeywords: z.array(z.string()).optional(),
        shopId: z.number().optional(),
        shopName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { runWebsiteAudit, crawlAndAuditSite, generateKeywordList, analyzeKeywords } = await import('./seo-engine');

        // Run homepage audit (fast, for the main score)
        const websiteAudit = await runWebsiteAudit(input.websiteUrl, input.customKeywords || []);

        // Run full site crawl (discovers and audits all pages)
        const fullSiteAudit = await crawlAndAuditSite(input.websiteUrl, input.customKeywords || []);

        // Run keyword analysis if city provided
        let keywordAnalysis = null;
        let keywordScore = null;
        if (input.city) {
          const keywords = generateKeywordList(
            input.city,
            input.surroundingAreas || [],
            input.customKeywords || []
          );
          // Fetch HTML again for keyword analysis
          let html = '';
          try {
            const resp = await fetch(input.websiteUrl.startsWith('http') ? input.websiteUrl : `https://${input.websiteUrl}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScaleDetailingSEOBot/1.0)' },
              redirect: 'follow',
            });
            html = await resp.text();
          } catch {}
          if (html) {
            keywordAnalysis = analyzeKeywords(html, keywords.slice(0, 50));
            keywordScore = keywordAnalysis.score;
          }
        }

        // Save to database
        const auditId = await db.createSeoAudit({
          shopId: input.shopId ?? null,
          shopName: input.shopName ?? null,
          websiteUrl: input.websiteUrl,
          city: input.city ?? null,
          surroundingAreas: input.surroundingAreas ?? null,
          targetKeywords: input.customKeywords ?? null,
          websiteAudit: websiteAudit as any,
          fullSiteAudit: fullSiteAudit as any,
          keywordAnalysis: keywordAnalysis as any,
          websiteScore: websiteAudit.score,
          keywordScore,
          overallScore: keywordScore
            ? Math.round((websiteAudit.score * 0.5 + keywordScore * 0.5))
            : websiteAudit.score,
          auditedById: ctx.user.id,
        });

        return {
          id: auditId,
          websiteAudit,
          fullSiteAudit,
          keywordAnalysis,
          websiteScore: websiteAudit.score,
          keywordScore,
        };
      }),

    // Save local SEO checklist (manual input)
    saveLocalChecklist: staffProcedure
      .input(z.object({
        auditId: z.number(),
        checklist: z.array(z.object({
          id: z.string(),
          category: z.string(),
          label: z.string(),
          description: z.string(),
          status: z.enum(['pass', 'warn', 'fail']),
          weight: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { calculateLocalSeoScore } = await import('./seo-engine');
        const localSeoScore = calculateLocalSeoScore(input.checklist);

        // Get current audit to recalculate overall
        const audit = await db.getSeoAuditById(input.auditId);
        if (!audit) throw new Error('Audit not found');

        const websiteScore = audit.websiteScore ?? 0;
        const keywordScore = audit.keywordScore ?? 0;
        const hasKeyword = audit.keywordScore !== null;

        // Weighted average: website 35%, local 35%, keywords 30%
        let overallScore: number;
        if (hasKeyword) {
          overallScore = Math.round(websiteScore * 0.35 + localSeoScore * 0.35 + keywordScore * 0.30);
        } else {
          overallScore = Math.round(websiteScore * 0.5 + localSeoScore * 0.5);
        }

        await db.updateSeoAudit(input.auditId, {
          localSeoChecklist: input.checklist as any,
          localSeoScore,
          overallScore,
        });

        return { localSeoScore, overallScore };
      }),

    // Get local SEO checklist template
    getChecklistTemplate: staffProcedure.query(async () => {
      const { getLocalSeoChecklist } = await import('./seo-engine');
      return getLocalSeoChecklist();
    }),

    // Get audit by ID
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSeoAuditById(input.id);
      }),

    // Get audit history for a shop
    getByShop: staffProcedure
      .input(z.object({ shopId: z.number() }))
      .query(async ({ input }) => {
        return db.getSeoAuditsByShop(input.shopId);
      }),

    // List all audits
    list: staffProcedure.query(async () => {
      return db.getSeoAudits(50);
    }),

    // Generate keyword suggestions
    generateKeywords: staffProcedure
      .input(z.object({
        city: z.string().min(1),
        surroundingAreas: z.array(z.string()).optional(),
        customKeywords: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const { generateKeywordList } = await import('./seo-engine');
        return generateKeywordList(input.city, input.surroundingAreas || [], input.customKeywords || []);
      }),

    // ─── Enhanced SEO Audit Features ───

    // Run competitor comparison
    runCompetitorComparison: staffProcedure
      .input(z.object({
        auditId: z.number(),
        shopUrl: z.string().min(1),
        shopName: z.string().min(1),
        competitorUrls: z.array(z.string()).min(1).max(5),
        city: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { runCompetitorComparison } = await import('./seo-enhanced-engine');
        const result = await runCompetitorComparison(input.shopUrl, input.shopName, input.competitorUrls, input.city);
        await db.updateSeoAudit(input.auditId, {
          competitorComparison: result as any,
          competitorScore: result.shopData.score,
        });
        return result;
      }),

    // Run GBP audit
    runGBPAudit: staffProcedure
      .input(z.object({
        auditId: z.number(),
        websiteUrl: z.string().min(1),
        shopName: z.string().min(1),
        city: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { runGBPAudit } = await import('./seo-enhanced-engine');
        const result = await runGBPAudit(input.websiteUrl, input.shopName, input.city);
        await db.updateSeoAudit(input.auditId, {
          gbpAudit: result as any,
          gbpScore: result.score,
        });
        return result;
      }),

    // Run content gap analysis
    runContentGapAnalysis: staffProcedure
      .input(z.object({
        auditId: z.number(),
        websiteUrl: z.string().min(1),
        shopName: z.string().min(1),
        city: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { runContentGapAnalysis } = await import('./seo-enhanced-engine');
        // Get the existing audit to use crawled pages
        const audit = await db.getSeoAuditById(input.auditId);
        const crawledPages = (audit?.fullSiteAudit as any)?.pages?.map((p: any) => ({
          url: p.url,
          title: p.title || '',
          path: p.path || new URL(p.url).pathname,
          wordCount: p.wordCount || 0,
        })) || [];
        const result = await runContentGapAnalysis(input.websiteUrl, crawledPages, input.shopName, input.city);
        await db.updateSeoAudit(input.auditId, {
          contentGapAnalysis: result as any,
          contentGapScore: result.score,
        });
        return result;
      }),

    // Run review & reputation analysis
    runReviewAnalysis: staffProcedure
      .input(z.object({
        auditId: z.number(),
        websiteUrl: z.string().min(1),
        shopName: z.string().min(1),
        city: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { runReviewAnalysis } = await import('./seo-enhanced-engine');
        const result = await runReviewAnalysis(input.websiteUrl, input.shopName, input.city);
        await db.updateSeoAudit(input.auditId, {
          reviewAnalysis: result as any,
          reviewScore: result.score,
        });
        return result;
      }),

    // Run citation & directory check
    runCitationCheck: staffProcedure
      .input(z.object({
        auditId: z.number(),
        websiteUrl: z.string().min(1),
        shopName: z.string().min(1),
        city: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { runCitationCheck } = await import('./seo-enhanced-engine');
        const result = await runCitationCheck(input.websiteUrl, input.shopName, input.city);
        await db.updateSeoAudit(input.auditId, {
          citationCheck: result as any,
          citationScore: result.score,
        });
        return result;
      }),

    // Run all enhanced audits at once
    runEnhancedAudit: staffProcedure
      .input(z.object({
        auditId: z.number(),
        websiteUrl: z.string().min(1),
        shopName: z.string().min(1),
        city: z.string().min(1),
        competitorUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const enhanced = await import('./seo-enhanced-engine');
        const audit = await db.getSeoAuditById(input.auditId);

        // Run all enhanced audits in parallel
        const [gbpResult, reviewResult, citationResult, contentGapResult, competitorResult] = await Promise.allSettled([
          enhanced.runGBPAudit(input.websiteUrl, input.shopName, input.city),
          enhanced.runReviewAnalysis(input.websiteUrl, input.shopName, input.city),
          enhanced.runCitationCheck(input.websiteUrl, input.shopName, input.city),
          enhanced.runContentGapAnalysis(
            input.websiteUrl,
            (audit?.fullSiteAudit as any)?.pages?.map((p: any) => ({
              url: p.url, title: p.title || '', path: p.path || '', wordCount: p.wordCount || 0,
            })) || [],
            input.shopName,
            input.city,
          ),
          input.competitorUrls?.length
            ? enhanced.runCompetitorComparison(input.websiteUrl, input.shopName, input.competitorUrls, input.city)
            : Promise.resolve(null),
        ]);

        const gbp = gbpResult.status === 'fulfilled' ? gbpResult.value : null;
        const review = reviewResult.status === 'fulfilled' ? reviewResult.value : null;
        const citation = citationResult.status === 'fulfilled' ? citationResult.value : null;
        const contentGap = contentGapResult.status === 'fulfilled' ? contentGapResult.value : null;
        const competitor = competitorResult.status === 'fulfilled' ? competitorResult.value : null;

        // Save all results
        await db.updateSeoAudit(input.auditId, {
          ...(gbp ? { gbpAudit: gbp as any, gbpScore: gbp.score } : {}),
          ...(review ? { reviewAnalysis: review as any, reviewScore: review.score } : {}),
          ...(citation ? { citationCheck: citation as any, citationScore: citation.score } : {}),
          ...(contentGap ? { contentGapAnalysis: contentGap as any, contentGapScore: contentGap.score } : {}),
          ...(competitor ? { competitorComparison: competitor as any, competitorScore: competitor.shopData.score } : {}),
        });

        return { gbp, review, citation, contentGap, competitor };
      }),
  }),

  // ─── Market Intelligence ───
  market: router({
    analyze: staffProcedure
      .input(z.object({
        city: z.string().min(1),
        state: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const prompt = `You are a market research analyst specializing in the auto detailing industry.

Analyze the market for auto detailing businesses in ${input.city}, ${input.state}.

Return a JSON object with these exact fields:
- population: number (metro area population estimate)
- medianIncome: number (median household income estimate)
- competitorCount: number (estimated number of detailing shops in the area)
- searchVolume: string (one of: "low", "medium", "high", "very_high" - based on likely Google search volume for "auto detailing" + "car detailing" + "ceramic coating" in this area)
- marketSaturation: string (one of: "low", "moderate", "high", "oversaturated" - based on competitor count relative to population)
- marketOpportunityScore: number (0-100, composite score where 100 = best opportunity)
- insights: string[] (3-5 key market insights specific to this city, e.g., "High concentration of luxury vehicles increases demand for PPF and ceramic coating", "University town creates seasonal demand fluctuations")

Be realistic and specific to this exact market. Use your knowledge of US demographics, economic data, and the detailing industry.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a market research analyst. Return only valid JSON, no markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'market_intelligence',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  population: { type: 'number' },
                  medianIncome: { type: 'number' },
                  competitorCount: { type: 'number' },
                  searchVolume: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
                  marketSaturation: { type: 'string', enum: ['low', 'moderate', 'high', 'oversaturated'] },
                  marketOpportunityScore: { type: 'number' },
                  insights: { type: 'array', items: { type: 'string' } },
                },
                required: ['population', 'medianIncome', 'competitorCount', 'searchVolume', 'marketSaturation', 'marketOpportunityScore', 'insights'],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new Error('No response from market analysis');

        const data = JSON.parse(content as string);
        return {
          city: input.city,
          state: input.state,
          ...data,
        };
      }),
  }),

  // ─── Assessment Templates ───
  templates: router({
    list: staffProcedure.query(async () => {
      return db.listTemplates();
    }),
    create: staffProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        scores: z.record(z.string(), z.any()),
        businessProfile: z.any().optional(),
        revenueTier: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTemplate({
          ...input,
          createdById: ctx.user.id,
          isDefault: false,
        });
        return { id };
      }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTemplate(input.id);
        return { success: true };
      }),
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTemplateById(input.id);
      }),
  }),

  // ─── Industry Benchmarks ───
  benchmarks: router({
    list: protectedProcedure.query(async () => {
      return db.listBenchmarks();
    }),
    create: adminProcedure
      .input(z.object({
        category: z.string().min(1),
        metric: z.string().min(1),
        label: z.string().min(1),
        value: z.number(),
        unit: z.string().optional(),
        source: z.string().optional(),
        region: z.string().optional(),
        shopTier: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createBenchmark({ ...input, createdById: ctx.user.id });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        value: z.number().optional(),
        unit: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBenchmark(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBenchmark(input.id);
        return { success: true };
      }),
  }),

  // ─── Onboarding ───
  onboarding: router({
    // Templates (admin)
    listTemplates: staffProcedure.query(async () => {
      return db.listOnboardingTemplates();
    }),
    createTemplate: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        items: z.array(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createOnboardingTemplate({
          ...input,
          createdById: ctx.user.id,
          isDefault: false,
        });
        return { id };
      }),
    deleteTemplate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOnboardingTemplate(input.id);
        return { success: true };
      }),
    // Checklists (assigned to shops)
    assignToShop: staffProcedure
      .input(z.object({
        shopId: z.number(),
        templateId: z.number().optional(),
        name: z.string().min(1),
        items: z.array(z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createOnboardingChecklist({
          ...input,
          assignedById: ctx.user.id,
          progress: 0,
        });
        return { id };
      }),
    getByShop: protectedProcedure
      .input(z.object({ shopId: z.number() }))
      .query(async ({ input }) => {
        return db.getChecklistByShop(input.shopId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getChecklistById(input.id);
      }),
    updateItem: protectedProcedure
      .input(z.object({
        checklistId: z.number(),
        items: z.array(z.any()),
        progress: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateChecklist(input.checklistId, {
          items: input.items,
          progress: input.progress,
          ...(input.progress >= 100 ? { completedAt: new Date() } : {}),
        });
        return { success: true };
      }),
    deleteChecklist: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChecklist(input.id);
        return { success: true };
      }),
  }),

  // ─── Trusted Installer Directory ───
  directory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Admin sees all, others see only approved
      const isAdmin = ctx.user.role === 'admin';
      return db.listDirectoryEntries(!isAdmin);
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        description: z.string().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        logoUrl: z.string().optional(),
        rating: z.number().optional(),
        featured: z.boolean().optional(),
        approved: z.boolean().optional(),
        accessLevel: z.enum(['public', 'customer', 'installer']).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createDirectoryEntry({ ...input, createdById: ctx.user.id });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        logoUrl: z.string().optional(),
        rating: z.number().optional(),
        featured: z.boolean().optional(),
        approved: z.boolean().optional(),
        accessLevel: z.enum(['public', 'customer', 'installer']).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDirectoryEntry(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDirectoryEntry(input.id);
        return { success: true };
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDirectoryEntryById(input.id);
      }),
  }),

  // ─── Portfolio Analytics ───
  portfolio: router({
    stats: staffProcedure.query(async () => {
      return db.getPortfolioStats();
    }),
  }),

  // ─── Public Stats (no auth required) ───
  publicStats: router({
    get: publicProcedure.query(async () => {
      return db.getPortfolioStats();
    }),
  }),
  // ─── API Key Management (admin only) ───
  apiKeys: router({
    list: adminProcedure.query(async () => {
      return db.getApiKeys();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()).default(["sales-data", "sales-team", "sales-bulk"]),
        expiresInDays: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate a secure API key: sk_live_<32 random chars>
        const randomPart = crypto.randomBytes(24).toString("base64url");
        const rawKey = `sk_live_${randomPart}`;
        const keyPrefix = rawKey.slice(0, 8);
        const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 86400000)
          : null;
        const id = await db.createApiKey({
          name: input.name,
          keyHash,
          keyPrefix,
          permissions: input.permissions,
          active: true,
          createdById: ctx.user.id,
          expiresAt,
        });
        // Return the raw key ONCE — it cannot be retrieved again
        return { id, key: rawKey, prefix: keyPrefix, message: "Save this key — it will not be shown again." };
      }),
    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deactivateApiKey(input.id);
        return { success: true };
      }),
  }),
  // ─── Sales Data (queried from dashboard) ───
  salesData: router({
    list: superAdminProcedure
      .input(z.object({
        shopId: z.number().optional(),
        limit: z.number().default(52),
      }).optional())
      .query(async ({ input }) => {
        if (input?.shopId) {
          return db.getSalesDataByShop(input.shopId, input.limit);
        }
        return db.getAllSalesData(input?.limit || 52);
      }),
    teamSnapshots: superAdminProcedure
      .input(z.object({
        salesDataId: z.number().optional(),
        memberName: z.string().optional(),
        limit: z.number().default(100),
      }).optional())
      .query(async ({ input }) => {
        if (input?.salesDataId) {
          return db.getTeamSnapshotsBySalesDataId(input.salesDataId);
        }
        if (input?.memberName) {
          return db.getTeamMemberHistory(input.memberName, input.limit);
        }
        return db.getAllTeamSnapshots(input?.limit || 100);
      }),

    // ─── Sales Arena Sync ───
    syncFromArena: superAdminProcedure
      .mutation(async () => {
        const result = await syncFromSalesArena();
        return result;
      }),

    liveOverview: superAdminProcedure
      .query(() => {
        const liveData = getSalesArenaLiveData();
        return { connected: liveData.data != null, data: liveData.data };
      }),
  }),

  // ─── Leads (Public Self-Assessment Lead Capture) ───
  leads: router({
    // Public: anyone can submit a lead (no auth required)
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Valid email required'),
        phone: z.string().min(7, 'Valid phone required'),
        shopName: z.string().optional(),
        scores: z.record(z.string(), z.object({ score: z.number() })).optional(),
        overallPercentage: z.number().optional(),
        pillarResults: z.array(z.object({
          id: z.string(),
          label: z.string(),
          percentage: z.number(),
          band: z.string(),
        })).optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const leadId = await db.createLead({
          name: input.name,
          email: input.email,
          phone: input.phone,
          shopName: input.shopName || null,
          scores: input.scores || null,
          overallPercentage: input.overallPercentage || null,
          pillarResults: input.pillarResults || null,
          status: 'new',
          source: input.source || 'self-assessment',
        });
        // Notify owner of new lead
        try {
          const { notifyOwner } = await import('./_core/notification');
          const score = input.overallPercentage ? ` — Score: ${input.overallPercentage.toFixed(0)}%` : '';
          const shop = input.shopName ? ` (${input.shopName})` : '';
          await notifyOwner({
            title: `New Lead: ${input.name}${shop}`,
            content: `**${input.name}**${shop}\nEmail: ${input.email}\nPhone: ${input.phone}${score}\n\nView leads at /leads`,
          });
        } catch (e) {
          console.warn('[Leads] Failed to notify owner:', e);
        }
        return { success: true, leadId };
      }),

    // Admin: list all leads
    list: adminProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => {
        return db.getAllLeads(input?.limit ?? 100, input?.offset ?? 0);
      }),

    // Admin: update lead status and/or notes
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['new', 'contacted', 'converted', 'closed']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateLeadStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    // Admin: stats by status
    stats: adminProcedure
      .query(async () => {
        return db.getLeadsStats();
      }),
  }),

  // ─── Portal (customer-facing) ─────────────────────────────────────────────
  portal: router({
    // Returns shop data + assessment history for the logged-in customer's shop.
    // Data isolation: always filters by user.shopId — never returns other shops.
    myData: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user.shopId) {
        return { shop: null, latestAssessment: null, history: [] };
      }
      return db.getPortalData(user.shopId);
    }),
  }),

  // ─── Admin Panel (super_admin only) ──────────────────────────────────────
  admin: router({
    listAllShops: superAdminProcedure.query(async () => {
      return db.getShopsWithLatestAssessment();
    }),

    listAllUsers: superAdminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    updateUserRole: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin', 'super_admin', 'customer']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    assignShopToUser: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        shopId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.assignShopToUser(input.userId, input.shopId);
        return { success: true };
      }),

    unlockShopResults: superAdminProcedure
      .input(z.object({
        shopId: z.number(),
        unlocked: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateShopResultsUnlocked(input.shopId, input.unlocked);
        return { success: true };
      }),

    runLearningAnalysis: superAdminProcedure.mutation(async () => {
      await analyzePatterns();
      return { success: true };
    }),

    getAIInsights: superAdminProcedure.query(async () => {
      const highRiskShops = await db.getHighRiskAssessments();
      const recentPatterns = await db.getLatestAlgorithmAdjustments(10);
      return { highRiskShops, recentPatterns };
    }),
  }),

  // ─── AI Assistant ─────────────────────────────────────────────────────────
  aiAssistant: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        assessmentId: z.number(),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Load assessment + predictions
        const result = await db.getAssessmentById(input.assessmentId);
        if (!result) throw new Error("Assessment not found");
        const { assessment, shopName } = result;

        // 2. Customer access check
        if (ctx.user.role === "customer" && ctx.user.shopId !== assessment.shopId) {
          throw new Error("Access denied");
        }

        // 3. Parse predictions if available
        let predictions: any = null;
        if (assessment.predictions) {
          try { predictions = JSON.parse(assessment.predictions as string); } catch {}
        }

        // 4. Build system prompt with full shop context
        const top3 = predictions?.top3Actions?.slice(0, 3).map((a: any) => `- ${a.action} (${a.pillar}, $${a.projectedLift}/mo lift)`).join("\n") ?? "Not yet generated";
        const bottlenecks = Array.isArray(assessment.bottlenecks)
          ? assessment.bottlenecks.slice(0, 3).map((b: any) => typeof b === "string" ? b : b.description || b.name || JSON.stringify(b)).join(", ")
          : "See assessment";

        const systemPrompt = `You are an AI business coach for ${shopName}, an auto detailing shop.

Their current SOS score is ${assessment.overallPercentage}% — ${assessment.overallBand}.
Scaling probability: ${Math.round(assessment.scalingProbability)}%.
Revenue tier: ${assessment.revenueTier}.
Current monthly revenue: ${assessment.currentRevenue ? "$" + assessment.currentRevenue.toLocaleString() : "not provided"}.
Goal monthly revenue: ${assessment.goalRevenue ? "$" + assessment.goalRevenue.toLocaleString() : "not provided"}.

Top bottlenecks: ${bottlenecks}.

Top 3 recommended actions:
${top3}

${predictions ? `Predicted revenue in 90 days if actions taken: $${predictions.revenueProjection?.projected90Days?.toLocaleString() ?? "unknown"}.
Risk level: ${predictions.riskScore?.level ?? "unknown"} — ${predictions.riskScore?.primaryRiskFactor ?? ""}.` : ""}

You help them understand their results and take action. Be specific, direct, and encouraging.
Never give generic advice — always tie answers to their actual scores and situation.
Keep responses conversational and under 150 words unless they ask for detail.
Do not use bullet points unless specifically asked. Write in plain paragraphs.`;

        // 5. Call LLM
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        const llmResult = await invokeLLM({ messages, max_tokens: 300 });
        const reply = llmResult.choices[0]?.message?.content ?? "I couldn't generate a response right now. Please try again.";

        return { reply };
      }),
  }),

  // ─── Self Assessments ─────────────────────────────────────────────────────
  selfAssessments: router({
    save: publicProcedure
      .input(z.object({
        email: z.string().email().optional(),
        shopId: z.number().optional(),
        scores: z.record(z.string(), z.number()),
        overallScore: z.number(),
        source: z.enum(["quiz", "portal"]),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSelfAssessment({
          email: input.email,
          shopId: input.shopId,
          scores: input.scores,
          overallScore: input.overallScore,
          source: input.source,
        });
        return { id };
      }),
  }),

  // ─── Magic Link Auth ──────────────────────────────────────────────────────
  // sendMagicLink: stores a token and logs the link (wire up email later).
  // verifyMagicLink: validates token, creates session, clears token.
});

export type AppRouter = typeof appRouter;
