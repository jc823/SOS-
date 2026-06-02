import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import bcrypt from "bcryptjs";
import { stripe } from "../stripe";
import { initializeDatabase } from "../initDb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── tRPC API ───────────────────────────────────────────────────────────────
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      let user = null;
      const token = req.cookies?.[COOKIE_NAME];
      if (token) {
        const payload = await sdk.verifySessionToken(token);
        if (payload?.sub) {
          try {
            const row = await db.getUserByOpenId(payload.sub);
            if (row) {
              const { passwordHash: _, ...safe } = row;
              user = safe;
            }
          } catch {
            // ignore DB errors during auth
          }
        }
      }
      return { user, req, res };
    },
  }),
);

// ─── Stripe Webhook ────────────────────────────────────────────────────────
// Must be registered BEFORE express.json() middleware so we get the raw body
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) { res.status(400).send("Stripe not configured"); return; }
  const sig = req.headers["stripe-signature"];
  if (!sig || !ENV.stripeWebhookSecret) { res.status(400).send("Missing signature"); return; }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
  } catch (err) {
    console.error("[Stripe] Webhook signature failed:", err);
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const userId = session.metadata?.userId ? Number(session.metadata.userId) : null;
        const plan = (session.metadata?.plan ?? "pro") as "pro" | "agent";
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await db.updateUserSubscription(userId, {
            stripeCustomerId: session.customer as string,
            subscriptionStatus: plan,
            subscriptionId: sub.id,
            subscriptionPeriodEnd: new Date((sub as any).current_period_end * 1000),
          });
          console.log(`[Stripe] User ${userId} upgraded to ${plan}`);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const user = await db.getUserByStripeCustomerId(sub.customer as string);
        if (user) {
          const active = sub.status === "active" || sub.status === "trialing";
          await db.updateUserSubscription(user.id, {
            subscriptionStatus: active ? (user.subscriptionStatus as "pro" | "agent" ?? "pro") : "free",
            subscriptionPeriodEnd: new Date((sub as any).current_period_end * 1000),
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const user = await db.getUserByStripeCustomerId(sub.customer as string);
        if (user) {
          await db.updateUserSubscription(user.id, {
            subscriptionStatus: "free",
            subscriptionId: null,
            subscriptionPeriodEnd: null,
          });
          console.log(`[Stripe] User ${user.id} downgraded to free`);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe] Webhook handler error:", err);
  }

  res.json({ received: true });
});

// ─── Diagnostic endpoint (safe — no secrets exposed) ──────────────────────
app.get("/api/admin-status", async (_req, res) => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const user = await db.getUserByUsername(adminUsername);
    const hashLength = user?.passwordHash?.length ?? 0;
    // Test bcrypt directly against the stored hash
    let bcryptMatch = false;
    if (user?.passwordHash) {
      bcryptMatch = await bcrypt.compare(adminPassword, user.passwordHash);
    }
    res.json({
      adminExists: !!user,
      adminUsername,
      hasPasswordHash: !!user?.passwordHash,
      hashLength,
      bcryptMatch,
      role: user?.role ?? null,
      dbUrl: (process.env.DATABASE_URL ?? "file:./local.db").replace(/\/\/.*@/, "//***@"),
      adminPasswordEnvSet: !!process.env.ADMIN_PASSWORD,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Serve static frontend in production ───────────────────────────────────
const isProd = ENV.nodeEnv === "production";
if (isProd) {
  const distDir = path.resolve(process.cwd(), "dist/public");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// ─── Seed / sync admin user on every boot ─────────────────────────────────
// Always ensures the admin user exists with the correct password.
// Change credentials via ADMIN_USERNAME / ADMIN_PASSWORD env vars.
async function seedAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const existing = await db.getUserByUsername(adminUsername);
    if (!existing) {
      await db.createUserWithPassword({
        username: adminUsername,
        passwordHash,
        name: "Admin",
        role: "super_admin",
      });
      console.log(`[Seed] Admin user created — username: "${adminUsername}"`);
    } else {
      // Always sync the password so env var changes take effect on redeploy
      await db.updateAdminPassword(existing.id, passwordHash);
      console.log(`[Seed] Admin password synced — username: "${adminUsername}"`);
    }
  } catch (err) {
    console.error("[Seed] Failed to seed admin user:", err);
  }
}

// Push schema then seed then listen
async function start() {
  // Create all tables if they don't exist — non-fatal if DB unreachable at startup
  try {
    await initializeDatabase();
  } catch (err) {
    console.error("[DB] Schema init failed — server will start anyway:", err);
  }

  await seedAdminUser();

  app.listen(ENV.port, () => {
    console.log(`[Server] Running on http://localhost:${ENV.port}`);
    console.log(`[Server] Mode: ${ENV.nodeEnv}`);
  });
}

start();

export { app };
