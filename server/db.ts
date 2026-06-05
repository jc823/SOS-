import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  shops, InsertShop, Shop,
  assessments, InsertAssessment, Assessment,
  outcomes, InsertOutcome, Outcome,
  algorithmAdjustments, InsertAlgorithmAdjustment, AlgorithmAdjustment,
  invites, InsertInvite, Invite,
  seoAudits, InsertSeoAudit, SeoAudit,
  assessmentTemplates, InsertAssessmentTemplate, AssessmentTemplate,
  industryBenchmarks, InsertIndustryBenchmark, IndustryBenchmark,
  onboardingTemplates, InsertOnboardingTemplate, OnboardingTemplate,
  onboardingChecklists, InsertOnboardingChecklist, OnboardingChecklist,
  directoryEntries, InsertDirectoryEntry, DirectoryEntry,
  leads, InsertLead, Lead,
  selfAssessments, InsertSelfAssessment,
  settings, Setting,
  salesData, InsertSalesData, SalesData,
  salesTeamSnapshots, InsertSalesTeamSnapshot, SalesTeamSnapshot,
  apiKeys, InsertApiKey, ApiKey,
  clientNotes, InsertClientNote,
  clientTasks, InsertClientTask,
  actionPlanProgress,
  supplyOrders,
  checklistTemplates,
  levelPermissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const url = process.env.DATABASE_URL ?? "";
      if (!url) {
        console.warn("[Database] DATABASE_URL not set");
        return null;
      }
      // SSL: auto-detect from URL params; don't force it for Railway internal connections
      const sslMode = url.includes("sslmode=require") || url.includes("ssl=true")
        ? ({ rejectUnauthorized: false } as const)
        : false;
      const client = postgres(url, { ssl: sslMode, max: 10 });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  role?: 'user' | 'admin' | 'super_admin' | 'customer';
  shopId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Generate a unique openId for custom auth users
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const result = await db.insert(users).values({
    openId,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    email: data.email || null,
    loginMethod: 'password',
    role: data.role || 'user',
    shopId: data.shopId || null,
    lastSignedIn: new Date(),
  }).returning({ id: users.id });
  return result[0].id;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomersByShop(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users)
    .where(and(eq(users.role, 'customer'), eq(users.shopId, shopId)));
}

// ─── Invites ───

export async function createInvite(data: { code: string; createdById: number; role?: 'user' | 'admin' | 'super_admin' | 'customer'; shopId?: number; expiresAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invites).values({
    code: data.code,
    createdById: data.createdById,
    role: data.role || 'user',
    shopId: data.shopId || null,
    expiresAt: data.expiresAt || null,
  }).returning({ id: invites.id });
  return result[0].id;
}

export async function getInviteByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markInviteUsed(inviteId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invites).set({ usedById: userId, usedAt: new Date() }).where(eq(invites.id, inviteId));
}

export async function getInvites() {
  const db = await getDb();
  if (!db) return [];
  // Use raw SQL to join both creator and used-by user names
  const rows = await db.execute(
    sql`SELECT i.*,
           c.name AS createdByName,
           u.name AS usedByName
         FROM invites i
         LEFT JOIN users c ON i.createdById = c.id
         LEFT JOIN users u ON i.usedById = u.id
         ORDER BY i.createdAt DESC`
  );
  return rows || [];
}

export async function deleteInvite(inviteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invites).where(eq(invites.id, inviteId));
}

// ─── Shops ───

export async function createShop(data: InsertShop): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shops).values(data).returning({ id: shops.id });
  return result[0].id;
}

export async function getShops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shops).orderBy(desc(shops.updatedAt));
}

export async function getShopById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function findOrCreateShop(name: string, createdById: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Try to find existing shop by name (case-insensitive)
  const existing = await db.select().from(shops)
    .where(sql`LOWER(${shops.name}) = LOWER(${name})`)
    .limit(1);
  if (existing.length > 0) return existing[0].id;
  // Create new shop
  const result = await db.insert(shops).values({ name, createdById }).returning({ id: shops.id });
  return result[0].id;
}

export async function updateShopLogo(shopId: number, logoUrl: string | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shops).set({ logoUrl }).where(eq(shops.id, shopId));
}

export async function getShopByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shops)
    .where(sql`LOWER(${shops.name}) = LOWER(${name})`)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Shop Dropdown Data ───

export async function getShopsWithLatestAssessment() {
  const db = await getDb();
  if (!db) return [];

  // Base shop fields — always available
  const baseShops = await db.select({
    id: shops.id,
    name: shops.name,
    logoUrl: shops.logoUrl,
    location: shops.location,
    contactName: shops.contactName,
    contactEmail: shops.contactEmail,
    contactPhone: shops.contactPhone,
    notes: shops.notes,
    brandName: shops.brandName,
    brandColor: shops.brandColor,
    brandAccentColor: shops.brandAccentColor,
    resultsUnlocked: shops.resultsUnlocked,
    createdAt: shops.createdAt,
    updatedAt: shops.updatedAt,
  }).from(shops).orderBy(desc(shops.updatedAt));

  // Try to enrich with assessment stats — if assessments table is missing
  // columns (older DB), fall back gracefully so shops still display.
  try {
    const enriched = await db.select({
      shopId: sql<number>`${shops.id}`,
      latestAssessmentId: sql<number>`(SELECT a.id FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestAssessmentDate: sql<string>`(SELECT a."assessmentDate" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestOverallPercentage: sql<number>`(SELECT a."overallPercentage" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestScalingProbability: sql<number>`(SELECT a."scalingProbability" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestRevenueTier: sql<string>`(SELECT a."revenueTier" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestCustomTarget: sql<number>`(SELECT a."customTarget" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestCurrentRevenue: sql<number>`(SELECT a."currentRevenue" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      latestBusinessProfile: sql<any>`(SELECT a."businessProfile" FROM assessments a WHERE a."shopId" = ${shops.id} ORDER BY a."createdAt" DESC LIMIT 1)`,
      assessmentCount: sql<number>`(SELECT COUNT(*) FROM assessments a WHERE a."shopId" = ${shops.id})`,
    }).from(shops).orderBy(desc(shops.updatedAt));

    const statsMap = new Map(enriched.map(r => [r.shopId, r]));
    return baseShops.map(s => ({ ...s, ...(statsMap.get(s.id) ?? {}) }));
  } catch {
    // Assessment columns not yet migrated — return shops without stats
    return baseShops.map(s => ({ ...s, assessmentCount: 0 }));
  }
}

// ─── Assessments ───

export async function createAssessment(data: InsertAssessment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assessments).values(data).returning({ id: assessments.id });
  return result[0].id;
}

export async function getAssessments(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    assessment: assessments,
    shopName: shops.name,
  })
    .from(assessments)
    .leftJoin(shops, eq(assessments.shopId, shops.id))
    .orderBy(desc(assessments.createdAt))
    .limit(limit);
}

export async function getAssessmentsByShop(shopId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    assessment: assessments,
    shopName: shops.name,
  })
    .from(assessments)
    .leftJoin(shops, eq(assessments.shopId, shops.id))
    .where(eq(assessments.shopId, shopId))
    .orderBy(desc(assessments.createdAt))
    .limit(limit);
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    assessment: assessments,
    shopName: shops.name,
    shopLogoUrl: shops.logoUrl,
  })
    .from(assessments)
    .leftJoin(shops, eq(assessments.shopId, shops.id))
    .where(eq(assessments.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getShopAssessments(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(assessments)
    .where(eq(assessments.shopId, shopId))
    .orderBy(desc(assessments.assessmentDate));
}

export async function deleteAssessment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assessments).where(eq(assessments.id, id));
}

// ─── Outcomes ───

export async function createOutcome(data: InsertOutcome): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(outcomes).values(data).returning({ id: outcomes.id });
  return result[0].id;
}

export async function getOutcomesByAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(outcomes).where(eq(outcomes.assessmentId, assessmentId));
}

export async function getAllOutcomesWithAssessments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    outcome: outcomes,
    assessment: assessments,
    shopName: shops.name,
  })
    .from(outcomes)
    .leftJoin(assessments, eq(outcomes.assessmentId, assessments.id))
    .leftJoin(shops, eq(outcomes.shopId, shops.id))
    .orderBy(desc(outcomes.createdAt));
}

// ─── Algorithm Adjustments ───

export async function createAlgorithmAdjustment(data: InsertAlgorithmAdjustment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(algorithmAdjustments).values(data).returning({ id: algorithmAdjustments.id });
  return result[0].id;
}

export async function getLatestAdjustments(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(algorithmAdjustments).orderBy(desc(algorithmAdjustments.createdAt)).limit(limit);
}

// Get shops due for re-evaluation (last assessment > daysThreshold days ago)
export async function getDueForReassessment(daysThreshold = 60) {
  const db = await getDb();
  if (!db) return [];
  // Get the latest assessment per shop, then filter by date
  const rows = await db.execute(
    sql`SELECT s.id as shopId, s.name as shopName,
           a.id as assessmentId, a.assessmentDate, a.overallPercentage, a.overallBand, a.scalingProbability,
           CAST((unixepoch('now') - a.createdAt) / 86400 AS INTEGER) as daysSinceAssessment
         FROM shops s
         INNER JOIN assessments a ON a.shopId = s.id
         WHERE a.id = (
           SELECT a2.id FROM assessments a2
           WHERE a2.shopId = s.id
           ORDER BY a2.createdAt DESC LIMIT 1
         )
         AND CAST((unixepoch('now') - a.createdAt) / 86400 AS INTEGER) >= ${daysThreshold}
         ORDER BY daysSinceAssessment DESC`
  );
  return rows || [];
}

// Get the latest business profile for a shop (from the most recent assessment that has one)
export async function getLatestBusinessProfile(shopId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    businessProfile: assessments.businessProfile,
    assessmentDate: assessments.assessmentDate,
    assessorName: assessments.assessorName,
    assessmentId: assessments.id,
  })
    .from(assessments)
    .where(and(eq(assessments.shopId, shopId), sql`${assessments.businessProfile} IS NOT NULL`))
    .orderBy(desc(assessments.createdAt))
    .limit(1);
  if (result.length === 0) return null;
  return {
    businessProfile: result[0].businessProfile,
    fromAssessmentDate: result[0].assessmentDate,
    fromAssessorName: result[0].assessorName,
    fromAssessmentId: result[0].assessmentId,
  };
}

// Get the previous assessment for a shop (the one before the given assessmentId)
export async function getPreviousAssessment(shopId: number, currentAssessmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(assessments)
    .where(and(eq(assessments.shopId, shopId), sql`${assessments.id} < ${currentAssessmentId}`))
    .orderBy(desc(assessments.id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get timeline data for a shop (all assessments with key metrics)
export async function getShopTimeline(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: assessments.id,
    assessmentDate: assessments.assessmentDate,
    overallPercentage: assessments.overallPercentage,
    overallBand: assessments.overallBand,
    scalingProbability: assessments.scalingProbability,
    revenueTier: assessments.revenueTier,
    assessorName: assessments.assessorName,
    pillarResults: assessments.pillarResults,
  })
    .from(assessments)
    .where(eq(assessments.shopId, shopId))
    .orderBy(assessments.assessmentDate);
}

export async function getLearningStats() {
  const db = await getDb();
  if (!db) return { totalAssessments: 0, totalOutcomes: 0, adjustmentsMade: 0, averageConfidence: 0, lastRecalibration: null };

  const [assessmentCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(assessments);
  const [outcomeCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(outcomes);
  const [adjustmentCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(algorithmAdjustments);
  const [avgConf] = await db.select({ avg: sql<number>`COALESCE(AVG(confidence), 0)` }).from(algorithmAdjustments);
  const [lastAdj] = await db.select({ latest: sql<string>`MAX(createdAt)` }).from(algorithmAdjustments);

  return {
    totalAssessments: assessmentCount?.count ?? 0,
    totalOutcomes: outcomeCount?.count ?? 0,
    adjustmentsMade: adjustmentCount?.count ?? 0,
    averageConfidence: avgConf?.avg ?? 0,
    lastRecalibration: lastAdj?.latest ?? null,
  };
}


// ─── Prediction Accuracy ───

// Get all reassessments that have actualRevenue data (for prediction validation)
export async function getReassessmentsWithActualRevenue() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT
          r.id as reassessmentId,
          r.shopId,
          r.assessmentDate as reassessmentDate,
          r.overallPercentage as newPercentage,
          r.scalingProbability as newProbability,
          r.actualRevenue,
          r.currentRevenue as newCurrentRevenue,
          r.goalRevenue as newGoalRevenue,
          r.revenueTier as newRevenueTier,
          r.previousAssessmentId,
          p.overallPercentage as prevPercentage,
          p.scalingProbability as prevProbability,
          p.revenueTier as prevRevenueTier,
          p.currentRevenue as prevCurrentRevenue,
          p.goalRevenue as prevGoalRevenue,
          p.assessmentDate as prevAssessmentDate,
          s.name as shopName
        FROM assessments r
        INNER JOIN assessments p ON r.previousAssessmentId = p.id
        INNER JOIN shops s ON r.shopId = s.id
        WHERE r.actualRevenue IS NOT NULL
        ORDER BY r.createdAt DESC`
  );
  return rows || [];
}

// Get all assessments with outcomes logged
export async function getAssessmentsWithOutcomes() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(
    sql`SELECT
          a.id as assessmentId,
          a.shopId,
          a.assessmentDate,
          a.overallPercentage,
          a.scalingProbability,
          a.revenueTier,
          a.currentRevenue,
          a.goalRevenue,
          o.hitTarget,
          o.actualRevenue as outcomeRevenue,
          o.monthsElapsed,
          o.notes as outcomeNotes,
          s.name as shopName
        FROM outcomes o
        INNER JOIN assessments a ON o.assessmentId = a.id
        INNER JOIN shops s ON a.shopId = s.id
        ORDER BY o.createdAt DESC`
  );
  return rows || [];
}

// Get aggregate prediction stats
export async function getPredictionStats() {
  const db = await getDb();
  if (!db) return { totalPredictions: 0, totalWithOutcomes: 0, totalReassessments: 0 };

  const [totalPred] = await db.select({ count: sql<number>`COUNT(*)` }).from(assessments);
  const [totalOutcomes] = await db.select({ count: sql<number>`COUNT(*)` }).from(outcomes);
  const [totalReassess] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(assessments)
    .where(sql`${assessments.previousAssessmentId} IS NOT NULL AND ${assessments.actualRevenue} IS NOT NULL`);

  return {
    totalPredictions: totalPred?.count ?? 0,
    totalWithOutcomes: totalOutcomes?.count ?? 0,
    totalReassessments: totalReassess?.count ?? 0,
  };
}

// ─── Action Plan Storage ───

export async function updateAssessmentActionPlan(assessmentId: number, actionPlan: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(assessments)
    .set({ actionPlan: JSON.stringify(actionPlan) })
    .where(eq(assessments.id, assessmentId));
}

// ─── SEO Audits ───

export async function createSeoAudit(data: Omit<InsertSeoAudit, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(seoAudits).values(data).returning({ id: seoAudits.id });
  return result[0].id;
}

export async function getSeoAuditById(id: number): Promise<SeoAudit | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(seoAudits).where(eq(seoAudits.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getSeoAuditsByShop(shopId: number): Promise<SeoAudit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoAudits).where(eq(seoAudits.shopId, shopId)).orderBy(desc(seoAudits.createdAt));
}

export async function getSeoAudits(limit = 50): Promise<SeoAudit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoAudits).orderBy(desc(seoAudits.createdAt)).limit(limit);
}

export async function updateSeoAudit(id: number, data: Partial<InsertSeoAudit>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(seoAudits).set(data).where(eq(seoAudits.id, id));
}


// ─── Assessment Templates ───

export async function createTemplate(data: InsertAssessmentTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assessmentTemplates).values(data).returning({ id: assessmentTemplates.id });
  return result[0].id;
}

export async function listTemplates(): Promise<AssessmentTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessmentTemplates).orderBy(desc(assessmentTemplates.createdAt));
}

export async function getTemplateById(id: number): Promise<AssessmentTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, id));
  return row;
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assessmentTemplates).where(eq(assessmentTemplates.id, id));
}

// ─── Industry Benchmarks ───

export async function createBenchmark(data: InsertIndustryBenchmark): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(industryBenchmarks).values(data).returning({ id: industryBenchmarks.id });
  return result[0].id;
}

export async function listBenchmarks(): Promise<IndustryBenchmark[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(industryBenchmarks).orderBy(industryBenchmarks.category, industryBenchmarks.metric);
}

export async function updateBenchmark(id: number, data: Partial<InsertIndustryBenchmark>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(industryBenchmarks).set(data).where(eq(industryBenchmarks.id, id));
}

export async function deleteBenchmark(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(industryBenchmarks).where(eq(industryBenchmarks.id, id));
}

// ─── Onboarding Templates ───

export async function createOnboardingTemplate(data: InsertOnboardingTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(onboardingTemplates).values(data).returning({ id: onboardingTemplates.id });
  return result[0].id;
}

export async function listOnboardingTemplates(): Promise<OnboardingTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingTemplates).orderBy(desc(onboardingTemplates.createdAt));
}

export async function deleteOnboardingTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(onboardingTemplates).where(eq(onboardingTemplates.id, id));
}

// ─── Onboarding Checklists ───

export async function createOnboardingChecklist(data: InsertOnboardingChecklist): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(onboardingChecklists).values(data).returning({ id: onboardingChecklists.id });
  return result[0].id;
}

export async function getChecklistByShop(shopId: number): Promise<OnboardingChecklist[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingChecklists).where(eq(onboardingChecklists.shopId, shopId)).orderBy(desc(onboardingChecklists.createdAt));
}

export async function getChecklistById(id: number): Promise<OnboardingChecklist | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.id, id));
  return row;
}

export async function updateChecklist(id: number, data: Partial<InsertOnboardingChecklist>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(onboardingChecklists).set(data).where(eq(onboardingChecklists.id, id));
}

export async function deleteChecklist(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(onboardingChecklists).where(eq(onboardingChecklists.id, id));
}

// ─── Directory Entries ───

export async function createDirectoryEntry(data: InsertDirectoryEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(directoryEntries).values(data).returning({ id: directoryEntries.id });
  return result[0].id;
}

export async function listDirectoryEntries(approvedOnly = false): Promise<DirectoryEntry[]> {
  const db = await getDb();
  if (!db) return [];
  if (approvedOnly) {
    return db.select().from(directoryEntries).where(eq(directoryEntries.approved, true)).orderBy(desc(directoryEntries.featured), directoryEntries.name);
  }
  return db.select().from(directoryEntries).orderBy(desc(directoryEntries.featured), directoryEntries.name);
}

export async function getDirectoryEntryById(id: number): Promise<DirectoryEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(directoryEntries).where(eq(directoryEntries.id, id));
  return row;
}

export async function updateDirectoryEntry(id: number, data: Partial<InsertDirectoryEntry>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(directoryEntries).set(data).where(eq(directoryEntries.id, id));
}

export async function deleteDirectoryEntry(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(directoryEntries).where(eq(directoryEntries.id, id));
}

// ─── Portfolio Analytics (aggregate queries) ───

export async function getPortfolioStats() {
  const db = await getDb();
  if (!db) return { totalShops: 0, totalAssessments: 0, totalConsultations: 0, avgScore: 0, avgImprovement: 0 };

  const [shopCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(shops);
  const [assessmentCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(assessments);
  const [consultationCount] = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(assessments).where(eq(assessments.assessmentType, 'consultation'));
  const [avgScoreResult] = await db.select({
    avg: sql<number>`AVG(overallPercentage)`
  }).from(assessments);

  // Compute average improvement for shops with multiple assessments
  const allAssessments = await db.select({
    shopId: assessments.shopId,
    overallPercentage: assessments.overallPercentage,
    createdAt: assessments.createdAt,
  }).from(assessments).orderBy(assessments.shopId, assessments.createdAt);

  let totalImprovement = 0;
  let improvementCount = 0;
  let lastShopId: number | null = null;
  let lastScore: number | null = null;
  for (const a of allAssessments) {
    if (a.shopId === lastShopId && lastScore !== null) {
      totalImprovement += a.overallPercentage - lastScore;
      improvementCount++;
    }
    lastShopId = a.shopId;
    lastScore = a.overallPercentage;
  }

  return {
    totalShops: shopCount?.count || 0,
    totalAssessments: (assessmentCount?.count || 0) - (consultationCount?.count || 0),
    totalConsultations: consultationCount?.count || 0,
    avgScore: Math.round(avgScoreResult?.avg || 0),
    avgImprovement: improvementCount > 0 ? Math.round((totalImprovement / improvementCount) * 10) / 10 : 0,
  };
}

// ─── Sales Data (External API) ───

export async function insertSalesData(data: InsertSalesData): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(salesData).values(data).returning({ id: salesData.id });
  return result[0].id;
}

export async function getSalesDataByShop(shopId: number, limit = 52) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesData)
    .where(eq(salesData.shopId, shopId))
    .orderBy(desc(salesData.periodEnd))
    .limit(limit);
}

export async function getSalesDataByPeriod(periodStart: string, periodEnd: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesData)
    .where(and(
      sql`${salesData.periodStart} >= ${periodStart}`,
      sql`${salesData.periodEnd} <= ${periodEnd}`
    ))
    .orderBy(desc(salesData.periodEnd));
}

export async function getAllSalesData(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesData)
    .orderBy(desc(salesData.periodEnd))
    .limit(limit);
}

export async function getSalesDataByExternalId(externalId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesData)
    .where(eq(salesData.externalId, externalId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function insertSalesTeamSnapshot(data: InsertSalesTeamSnapshot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(salesTeamSnapshots).values(data).returning({ id: salesTeamSnapshots.id });
  return result[0].id;
}

export async function getTeamSnapshotsBySalesDataId(salesDataId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesTeamSnapshots)
    .where(eq(salesTeamSnapshots.salesDataId, salesDataId));
}

export async function getTeamMemberHistory(memberName: string, limit = 52) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesTeamSnapshots)
    .where(eq(salesTeamSnapshots.memberName, memberName))
    .orderBy(desc(salesTeamSnapshots.createdAt))
    .limit(limit);
}

export async function getAllTeamSnapshots(limit = 500) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesTeamSnapshots)
    .orderBy(desc(salesTeamSnapshots.createdAt))
    .limit(limit);
}

// ─── API Keys ───

export async function createApiKey(data: InsertApiKey): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(apiKeys).values(data).returning({ id: apiKeys.id });
  return result[0].id;
}

export async function getApiKeyByPrefix(prefix: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.active, true)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApiKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    keyPrefix: apiKeys.keyPrefix,
    permissions: apiKeys.permissions,
    active: apiKeys.active,
    lastUsedAt: apiKeys.lastUsedAt,
    expiresAt: apiKeys.expiresAt,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function updateApiKeyLastUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

export async function deactivateApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set({ active: false }).where(eq(apiKeys.id, id));
}

// ─── Leads (Public Self-Assessment Lead Capture) ───

export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data).returning({ id: leads.id });
  return result[0].id;
}

export async function getAllLeads(limit = 100, offset = 0): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getLeadById(id: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLeadStatus(id: number, status: string, notes?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Partial<Lead> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(leads).set(updateData).where(eq(leads.id, id));
}

export async function getLeadsStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
  const db = await getDb();
  if (!db) return { total: 0, byStatus: {} };
  const all = await db.select().from(leads);
  const byStatus: Record<string, number> = {};
  for (const lead of all) {
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
  }
  return { total: all.length, byStatus };
}

// ─── Admin: User Management ───────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateAdminPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: 'user' | 'admin' | 'super_admin' | 'customer'): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function assignShopToUser(userId: number, shopId: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ shopId: shopId ?? undefined, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Admin: Shop Management ───────────────────────────────────────────────────

export async function updateShopResultsUnlocked(shopId: number, unlocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(shops).set({ resultsUnlocked: unlocked, updatedAt: new Date() }).where(eq(shops.id, shopId));
}

// ─── Magic Link Auth ──────────────────────────────────────────────────────────

export async function setMagicLinkToken(userId: number, token: string, expiry: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ magicLinkToken: token, magicLinkExpiry: expiry }).where(eq(users.id, userId));
}

export async function getUserByMagicToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.magicLinkToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function clearMagicLinkToken(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ magicLinkToken: null, magicLinkExpiry: null }).where(eq(users.id, userId));
}

// ─── Portal: Customer Data ────────────────────────────────────────────────────

export async function getPortalData(shopId: number) {
  const db = await getDb();
  if (!db) return null;

  const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  if (!shop[0]) return null;

  const shopAssessments = await db
    .select()
    .from(assessments)
    .where(eq(assessments.shopId, shopId))
    .orderBy(desc(assessments.createdAt))
    .limit(10);

  return {
    shop: shop[0],
    latestAssessment: shopAssessments[0] ?? null,
    history: shopAssessments,
  };
}

// ─── Prediction Engine ────────────────────────────────────────────────────────

export async function updateAssessmentPredictions(assessmentId: number, predictions: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(assessments).set({ predictions }).where(eq(assessments.id, assessmentId));
}

export async function getLatestAlgorithmAdjustments(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(algorithmAdjustments).orderBy(desc(algorithmAdjustments.createdAt)).limit(limit);
}

export async function getIndustryBenchmarks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(industryBenchmarks).orderBy(industryBenchmarks.category, industryBenchmarks.metric);
}

export async function createSelfAssessment(data: InsertSelfAssessment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(selfAssessments).values(data).returning({ id: selfAssessments.id });
  return result[0].id;
}

export async function getHighRiskAssessments() {
  const db = await getDb();
  if (!db) return [];

  // Fetch all assessments with non-null predictions, joined with shops
  const rows = await db.select({
    assessmentId: assessments.id,
    shopId: assessments.shopId,
    shopName: shops.name,
    overallPercentage: assessments.overallPercentage,
    assessmentDate: assessments.assessmentDate,
    predictions: assessments.predictions,
  })
    .from(assessments)
    .leftJoin(shops, eq(assessments.shopId, shops.id))
    .where(sql`${assessments.predictions} IS NOT NULL`)
    .orderBy(desc(assessments.createdAt));

  // Get last assessment per shop, filter by riskScore.score > 0.55
  const latestPerShop = new Map<number, typeof rows[0]>();
  for (const row of rows) {
    if (!latestPerShop.has(row.shopId)) {
      latestPerShop.set(row.shopId, row);
    }
  }

  const result: Array<{
    assessmentId: number;
    shopId: number;
    shopName: string | null;
    overallPercentage: number;
    assessmentDate: string;
    predictions: string | null;
  }> = [];

  for (const row of latestPerShop.values()) {
    try {
      const parsed = JSON.parse(row.predictions as string);
      if (parsed?.riskScore?.score > 0.55) {
        result.push(row);
      }
    } catch {
      // skip rows with unparseable predictions
    }
  }

  return result;
}

// ─── System Settings ─────────────────────────────────────────────────────────


const DEFAULT_SETTINGS: Array<{ key: string; value: string; label: string; description: string; category: string }> = [
  { key: "quiz_enabled",            value: "true",  label: "Public Quiz",           description: "Allow anyone to access /quiz without logging in",           category: "features" },
  { key: "portal_enabled",          value: "true",  label: "Customer Portal",       description: "Allow customers to log in and view their portal",           category: "features" },
  { key: "ai_assistant_enabled",    value: "true",  label: "AI Coach",              description: "Show the AI coaching assistant in the customer portal",     category: "features" },
  { key: "registrations_enabled",   value: "true",  label: "New Registrations",     description: "Allow new accounts to be created via invite codes",         category: "features" },
  { key: "maintenance_mode",        value: "false", label: "Maintenance Mode",      description: "Show a maintenance page to all non-admin users",           category: "system"   },
  { key: "results_locked_default",  value: "true",  label: "Lock Results by Default", description: "New shops have results locked until manually unlocked",  category: "features" },
  { key: "app_name",                value: "SOS Scorecard", label: "App Name",     description: "Display name shown throughout the app",                     category: "branding" },
  { key: "support_email",           value: "",      label: "Support Email",         description: "Email shown to customers when they need help",             category: "branding" },
];

export async function getAllSettings(): Promise<Setting[]> {
  const db = await getDb();
  if (!db) return [];
  // Seed defaults if empty
  const existing = await db.select().from(settings);
  if (existing.length === 0) {
    for (const s of DEFAULT_SETTINGS) {
      await db.insert(settings).values(s).onConflictDoNothing();
    }
    return db.select().from(settings).orderBy(settings.category, settings.key);
  }
  // Upsert any missing defaults
  for (const s of DEFAULT_SETTINGS) {
    const found = existing.find(e => e.key === s.key);
    if (!found) await db.insert(settings).values(s).onConflictDoNothing();
  }
  return db.select().from(settings).orderBy(settings.category, settings.key);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function updateSetting(key: string, value: string, updatedById?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(settings)
    .set({ value, updatedById: updatedById ?? null, updatedAt: new Date() })
    .where(eq(settings.key, key));
}

// ─── Billing / Subscriptions ──────────────────────────────────────────────────

export async function updateUserSubscription(userId: number, data: {
  stripeCustomerId?: string;
  subscriptionStatus?: 'free' | 'pro' | 'agent';
  subscriptionId?: string | null;
  subscriptionPeriodEnd?: Date | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return rows[0] ?? null;
}

// ─── CRM: Notes ──────────────────────────────────────────────────────────────

export async function getNotesByShop(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientNotes).where(eq(clientNotes.shopId, shopId)).orderBy(desc(clientNotes.createdAt));
}

export async function addNote(data: InsertClientNote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientNotes).values(data).returning({ id: clientNotes.id });
  return result[0].id;
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientNotes).where(eq(clientNotes.id, id));
}

// ─── CRM: Tasks ──────────────────────────────────────────────────────────────

export async function getTasksByShop(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientTasks).where(eq(clientTasks.shopId, shopId)).orderBy(clientTasks.dueDate);
}

export async function createTask(data: InsertClientTask): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientTasks).values(data).returning({ id: clientTasks.id });
  return result[0].id;
}

export async function completeTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(clientTasks).set({ completed: true, completedAt: new Date(), updatedAt: new Date() }).where(eq(clientTasks.id, id));
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientTasks).where(eq(clientTasks.id, id));
}

// ─── CRM: Action Plan Progress ────────────────────────────────────────────────

export async function getActionProgress(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(actionPlanProgress).where(eq(actionPlanProgress.assessmentId, assessmentId)).orderBy(actionPlanProgress.actionIndex);
}

export async function upsertActionProgress(data: { assessmentId: number; shopId: number; actionIndex: number; actionText: string; completed: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(actionPlanProgress)
    .where(and(eq(actionPlanProgress.assessmentId, data.assessmentId), eq(actionPlanProgress.actionIndex, data.actionIndex)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(actionPlanProgress).set({
      completed: data.completed,
      completedAt: data.completed ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(actionPlanProgress.id, existing[0].id));
  } else {
    await db.insert(actionPlanProgress).values({ ...data, completedAt: data.completed ? new Date() : null });
  }
}

// ─── CRM: All clients overview ────────────────────────────────────────────────

export async function getAllClientsForCRM() {
  const db = await getDb();
  if (!db) return [];
  const allShops = await db.select().from(shops).orderBy(desc(shops.updatedAt));
  const results = await Promise.all(allShops.map(async (shop) => {
    const [latestAssessment] = await db.select().from(assessments).where(eq(assessments.shopId, shop.id)).orderBy(desc(assessments.createdAt)).limit(1);
    const notes = await db.select({ id: clientNotes.id }).from(clientNotes).where(eq(clientNotes.shopId, shop.id));
    const tasks = await db.select().from(clientTasks).where(eq(clientTasks.shopId, shop.id));
    return {
      shop,
      latestAssessment: latestAssessment ?? null,
      noteCount: notes.length,
      taskCount: tasks.length,
      openTaskCount: tasks.filter(t => !t.completed).length,
    };
  }));
  return results;
}

// ─── Supply Orders ────────────────────────────────────────────────────────────

export async function getSupplyOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplyOrders).where(eq(supplyOrders.requestedById, userId)).orderBy(desc(supplyOrders.createdAt)).limit(50);
}

export async function getUsersByShop(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    username: users.username,
    email: users.email,
    role: users.role,
    techLevel: users.techLevel,
    techPermissions: users.techPermissions,
    shopId: users.shopId,
  }).from(users).where(eq(users.shopId, shopId)).orderBy(users.name);
}

export async function getSupplyOrdersByShop(shopId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplyOrders).where(eq(supplyOrders.shopId, shopId)).orderBy(desc(supplyOrders.createdAt)).limit(100);
}

export async function createSupplyOrder(data: { shopId: number; requestedById: number; items: any; notes: string | null; status: string }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplyOrders).values(data).returning({ id: supplyOrders.id });
  return result[0].id;
}

export async function updateSupplyOrderStatus(orderId: number, status: string, approvedById: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(supplyOrders).set({
    status,
    approvedById: status === "approved" ? approvedById : undefined,
    approvedAt: status === "approved" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(supplyOrders.id, orderId));
}

// ─── Shop Branding ────────────────────────────────────────────────────────────

export async function updateShopBranding(shopId: number, data: { brandName?: string; brandColor?: string; brandAccentColor?: string; logoUrl?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(shops).set({ ...data, updatedAt: new Date() }).where(eq(shops.id, shopId));
}

export async function updateShop(shopId: number, data: { name?: string; location?: string; contactName?: string; contactEmail?: string; contactPhone?: string; notes?: string; logoUrl?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(shops).set({ ...data, updatedAt: new Date() }).where(eq(shops.id, shopId));
}

export async function deleteShop(shopId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(shops).where(eq(shops.id, shopId));
}

// ─── Tech Level / Permissions ─────────────────────────────────────────────────

export async function getLevelPermissions(shopId: number): Promise<Array<{ level: number; permissions: Record<string, boolean> }>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(levelPermissions).where(eq(levelPermissions.shopId, shopId)).orderBy(levelPermissions.level);
  return rows.map(r => ({ level: r.level, permissions: (r.permissions as Record<string, boolean>) ?? {} }));
}

export async function upsertLevelPermissions(shopId: number, level: number, permissions: Record<string, boolean>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(levelPermissions).values({ shopId, level, permissions }).onConflictDoUpdate({
    target: [levelPermissions.shopId, levelPermissions.level],
    set: { permissions, updatedAt: new Date() },
  });
}

// ─── Tech Level Management ────────────────────────────────────────────────────

export async function updateUserTechLevel(userId: number, techLevel: number | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ techLevel, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Individual Tech Permission Overrides ────────────────────────────────────

export async function updateUserTechPermissions(userId: number, permissions: Record<string, boolean>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ techPermissions: permissions, updatedAt: new Date() } as any).where(eq(users.id, userId));
}

// ─── Checklist Template Management ───────────────────────────────────────────

export async function getChecklistTemplate(shopId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(checklistTemplates)
    .where(and(eq(checklistTemplates.shopId, shopId), eq(checklistTemplates.isActive, true)))
    .orderBy(desc(checklistTemplates.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function saveChecklistTemplate(shopId: number, name: string, items: any[], createdById: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Deactivate existing templates for this shop
  await db.update(checklistTemplates).set({ isActive: false }).where(eq(checklistTemplates.shopId, shopId));
  // Insert new active template
  await db.insert(checklistTemplates).values({ shopId, name, items, isActive: true, createdById });
}
