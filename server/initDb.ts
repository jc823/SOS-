/**
 * initDb.ts — Creates all PostgreSQL tables at startup if they don't exist.
 * Replaces drizzle-kit push in production. Safe to run multiple times (IF NOT EXISTS).
 */
import postgres from "postgres";

export async function initializeDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    console.warn("[DB] DATABASE_URL not set — skipping schema init");
    return;
  }

  const sql = postgres(url, { max: 1 });

  try {
    console.log("[DB] Initializing schema...");

    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "openId" text NOT NULL UNIQUE,
        "username" text UNIQUE,
        "passwordHash" text,
        "name" text,
        "email" text,
        "loginMethod" text,
        "role" text NOT NULL DEFAULT 'user',
        "shopId" integer,
        "magicLinkToken" text,
        "magicLinkExpiry" timestamp,
        "stripeCustomerId" text,
        "subscriptionStatus" text NOT NULL DEFAULT 'free',
        "subscriptionId" text,
        "subscriptionPeriodEnd" timestamp,
        "techLevel" integer,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "lastSignedIn" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "invites" (
        "id" serial PRIMARY KEY,
        "code" text NOT NULL UNIQUE,
        "createdById" integer NOT NULL,
        "usedById" integer,
        "role" text NOT NULL DEFAULT 'user',
        "shopId" integer,
        "expiresAt" timestamp,
        "usedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "shops" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "location" text,
        "contactName" text,
        "contactEmail" text,
        "contactPhone" text,
        "notes" text,
        "logoUrl" text,
        "createdById" integer NOT NULL,
        "resultsUnlocked" boolean NOT NULL DEFAULT false,
        "brandName" text,
        "brandColor" text,
        "brandAccentColor" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "assessments" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "assessorId" integer NOT NULL,
        "assessorName" text NOT NULL,
        "assessmentType" text NOT NULL DEFAULT 'assessment',
        "assessmentDate" text NOT NULL,
        "revenueTier" text NOT NULL,
        "customTarget" integer,
        "notes" text,
        "overallPercentage" real NOT NULL,
        "overallBand" text NOT NULL,
        "scalingProbability" real NOT NULL,
        "scores" jsonb NOT NULL,
        "pillarResults" jsonb NOT NULL,
        "bottlenecks" jsonb NOT NULL,
        "topLeveragePriorities" jsonb NOT NULL,
        "actionPlan" jsonb,
        "currentRevenue" integer,
        "goalRevenue" integer,
        "businessProfile" jsonb,
        "previousAssessmentId" integer,
        "actualRevenue" integer,
        "predictions" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "outcomes" (
        "id" serial PRIMARY KEY,
        "assessmentId" integer NOT NULL,
        "shopId" integer NOT NULL,
        "hitTarget" text NOT NULL,
        "actualRevenue" integer,
        "monthsElapsed" integer,
        "notes" text,
        "loggedById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "algorithmAdjustments" (
        "id" serial PRIMARY KEY,
        "adjustmentType" text NOT NULL,
        "pillarId" text,
        "subcategoryId" text,
        "previousValue" real,
        "newValue" real,
        "confidence" real,
        "sampleSize" integer,
        "description" text,
        "payload" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "webhooks" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "url" text NOT NULL,
        "secret" text,
        "events" jsonb NOT NULL,
        "active" boolean NOT NULL DEFAULT false,
        "createdById" integer NOT NULL,
        "lastTriggeredAt" timestamp,
        "lastStatus" integer,
        "failCount" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "webhookDeliveries" (
        "id" serial PRIMARY KEY,
        "webhookId" integer NOT NULL,
        "event" text NOT NULL,
        "payload" jsonb NOT NULL,
        "responseStatus" integer,
        "responseBody" text,
        "success" boolean NOT NULL DEFAULT false,
        "attemptNumber" integer NOT NULL DEFAULT 1,
        "deliveredAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "seoAudits" (
        "id" serial PRIMARY KEY,
        "shopId" integer,
        "shopName" text,
        "websiteUrl" text NOT NULL,
        "city" text,
        "surroundingAreas" jsonb,
        "targetKeywords" jsonb,
        "websiteAudit" jsonb,
        "fullSiteAudit" jsonb,
        "localSeoChecklist" jsonb,
        "keywordAnalysis" jsonb,
        "competitorComparison" jsonb,
        "gbpAudit" jsonb,
        "contentGapAnalysis" jsonb,
        "reviewAnalysis" jsonb,
        "citationCheck" jsonb,
        "websiteScore" real,
        "localSeoScore" real,
        "keywordScore" real,
        "competitorScore" real,
        "gbpScore" real,
        "contentGapScore" real,
        "reviewScore" real,
        "citationScore" real,
        "overallScore" real,
        "auditedById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "assessmentTemplates" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "category" text,
        "scores" jsonb NOT NULL,
        "businessProfile" jsonb,
        "revenueTier" text,
        "createdById" integer NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "industryBenchmarks" (
        "id" serial PRIMARY KEY,
        "category" text NOT NULL,
        "metric" text NOT NULL,
        "label" text NOT NULL,
        "value" real NOT NULL,
        "unit" text,
        "source" text,
        "region" text,
        "shopTier" text,
        "notes" text,
        "createdById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "onboardingTemplates" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "items" jsonb NOT NULL,
        "createdById" integer NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "onboardingChecklists" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "templateId" integer,
        "name" text NOT NULL,
        "items" jsonb NOT NULL,
        "progress" real NOT NULL DEFAULT 0,
        "assignedById" integer NOT NULL,
        "startedAt" timestamp,
        "completedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "directoryEntries" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "description" text,
        "website" text,
        "contactName" text,
        "contactEmail" text,
        "contactPhone" text,
        "location" text,
        "logoUrl" text,
        "rating" real,
        "featured" boolean NOT NULL DEFAULT false,
        "approved" boolean NOT NULL DEFAULT false,
        "accessLevel" text NOT NULL DEFAULT 'customer',
        "tags" jsonb,
        "notes" text,
        "createdById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "salesData" (
        "id" serial PRIMARY KEY,
        "shopId" integer,
        "shopName" text,
        "periodStart" text NOT NULL,
        "periodEnd" text NOT NULL,
        "periodType" text NOT NULL,
        "totalRevenue" real,
        "serviceRevenue" real,
        "productRevenue" real,
        "totalDeals" integer,
        "totalLeads" integer,
        "closeRate" real,
        "avgTicketSize" real,
        "newCustomers" integer,
        "returningCustomers" integer,
        "rebookingRate" real,
        "adSpend" real,
        "costPerLead" real,
        "costPerAcquisition" real,
        "avgJobDuration" real,
        "utilizationRate" real,
        "totalCommissions" real,
        "rawPayload" jsonb,
        "source" text NOT NULL,
        "externalId" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "salesTeamSnapshots" (
        "id" serial PRIMARY KEY,
        "salesDataId" integer,
        "memberName" text NOT NULL,
        "memberExternalId" text,
        "memberRole" text,
        "dealsCount" integer,
        "leadsAssigned" integer,
        "leadsConverted" integer,
        "personalCloseRate" real,
        "revenue" real,
        "avgTicketSize" real,
        "commissionRate" real,
        "commissionEarned" real,
        "bonuses" real,
        "totalPay" real,
        "callsMade" integer,
        "followUpsSent" integer,
        "appointmentsSet" integer,
        "appointmentsKept" integer,
        "rawPayload" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "apiKeys" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "keyHash" text NOT NULL,
        "keyPrefix" text NOT NULL,
        "permissions" jsonb NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "lastUsedAt" timestamp,
        "createdById" integer NOT NULL,
        "expiresAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "shopName" text,
        "scores" jsonb,
        "overallPercentage" real,
        "pillarResults" jsonb,
        "status" text NOT NULL DEFAULT 'new',
        "notes" text,
        "source" text NOT NULL DEFAULT 'self-assessment',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "self_assessments" (
        "id" serial PRIMARY KEY,
        "shopId" integer,
        "email" text,
        "scores" jsonb NOT NULL,
        "overallScore" real NOT NULL,
        "source" text NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY,
        "key" text NOT NULL UNIQUE,
        "value" text NOT NULL,
        "label" text NOT NULL,
        "description" text,
        "category" text NOT NULL DEFAULT 'general',
        "updatedById" integer,
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "clientNotes" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "content" text NOT NULL,
        "createdById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "clientTasks" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "dueDate" timestamp,
        "completed" boolean NOT NULL DEFAULT false,
        "completedAt" timestamp,
        "createdById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "actionPlanProgress" (
        "id" serial PRIMARY KEY,
        "assessmentId" integer NOT NULL,
        "shopId" integer NOT NULL,
        "actionIndex" integer NOT NULL,
        "actionText" text NOT NULL,
        "completed" boolean NOT NULL DEFAULT false,
        "completedAt" timestamp,
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "levelPermissions" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "level" integer NOT NULL,
        "permissions" jsonb NOT NULL DEFAULT '{}',
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        UNIQUE("shopId", "level")
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "supplyOrders" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "requestedById" integer NOT NULL,
        "items" jsonb NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "notes" text,
        "approvedById" integer,
        "approvedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "checklistTemplates" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "name" text NOT NULL,
        "items" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdById" integer NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "checklistCompletions" (
        "id" serial PRIMARY KEY,
        "shopId" integer NOT NULL,
        "templateId" integer NOT NULL,
        "completedById" integer NOT NULL,
        "date" text NOT NULL,
        "completedItems" jsonb NOT NULL DEFAULT '[]',
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `;

    // Add new columns to existing tables if they don't exist
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "techLevel" integer`;
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "techPermissions" jsonb`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "brandName" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "brandColor" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "brandAccentColor" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "location" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "contactName" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "contactEmail" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "contactPhone" text`;
    await sql`ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "notes" text`;

    console.log("[DB] Schema initialized ✓");
  } catch (err) {
    console.error("[DB] Schema initialization failed:", err);
    // Don't throw — let the server start; queries will fail with clear errors
  } finally {
    await sql.end();
  }
}
