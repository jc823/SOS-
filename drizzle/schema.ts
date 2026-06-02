import {
  integer,
  sqliteTable,
  text,
  real,
} from "drizzle-orm/sqlite-core";

// ─── Users ───
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  username: text("username").unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin", "super_admin", "customer"] }).default("user").notNull(),
  shopId: integer("shopId"),
  magicLinkToken: text("magicLinkToken"),
  magicLinkExpiry: integer("magicLinkExpiry", { mode: "timestamp" }),
  // Stripe billing
  stripeCustomerId: text("stripeCustomerId"),
  subscriptionStatus: text("subscriptionStatus", { enum: ["free", "pro", "agent"] }).default("free").notNull(),
  subscriptionId: text("subscriptionId"),
  subscriptionPeriodEnd: integer("subscriptionPeriodEnd", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Invites ───
export const invites = sqliteTable("invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  createdById: integer("createdById").notNull(),
  usedById: integer("usedById"),
  role: text("role", { enum: ["user", "admin", "super_admin", "customer"] }).default("user").notNull(),
  shopId: integer("shopId"),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  usedAt: integer("usedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

// ─── Shops ───
export const shops = sqliteTable("shops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location"),
  contactName: text("contactName"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  notes: text("notes"),
  logoUrl: text("logoUrl"),
  createdById: integer("createdById").notNull(),
  resultsUnlocked: integer("resultsUnlocked", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Shop = typeof shops.$inferSelect;
export type InsertShop = typeof shops.$inferInsert;

// ─── Assessments ───
export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId").notNull(),
  assessorId: integer("assessorId").notNull(),
  assessorName: text("assessorName").notNull(),
  assessmentType: text("assessmentType", { enum: ["assessment", "consultation"] }).default("assessment").notNull(),
  assessmentDate: text("assessmentDate").notNull(),
  revenueTier: text("revenueTier").notNull(),
  customTarget: integer("customTarget"),
  notes: text("notes"),
  overallPercentage: real("overallPercentage").notNull(),
  overallBand: text("overallBand").notNull(),
  scalingProbability: real("scalingProbability").notNull(),
  scores: text("scores", { mode: "json" }).notNull(),
  pillarResults: text("pillarResults", { mode: "json" }).notNull(),
  bottlenecks: text("bottlenecks", { mode: "json" }).notNull(),
  topLeveragePriorities: text("topLeveragePriorities", { mode: "json" }).notNull(),
  actionPlan: text("actionPlan", { mode: "json" }),
  currentRevenue: integer("currentRevenue"),
  goalRevenue: integer("goalRevenue"),
  businessProfile: text("businessProfile", { mode: "json" }),
  previousAssessmentId: integer("previousAssessmentId"),
  actualRevenue: integer("actualRevenue"),
  predictions: text("predictions"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ─── Outcomes ───
export const outcomes = sqliteTable("outcomes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assessmentId: integer("assessmentId").notNull(),
  shopId: integer("shopId").notNull(),
  hitTarget: text("hitTarget", { enum: ["yes", "no", "partial", "unknown"] }).notNull(),
  actualRevenue: integer("actualRevenue"),
  monthsElapsed: integer("monthsElapsed"),
  notes: text("notes"),
  loggedById: integer("loggedById").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Outcome = typeof outcomes.$inferSelect;
export type InsertOutcome = typeof outcomes.$inferInsert;

// ─── Algorithm Adjustments ───
export const algorithmAdjustments = sqliteTable("algorithmAdjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adjustmentType: text("adjustmentType").notNull(),
  pillarId: text("pillarId"),
  subcategoryId: text("subcategoryId"),
  previousValue: real("previousValue"),
  newValue: real("newValue"),
  confidence: real("confidence"),
  sampleSize: integer("sampleSize"),
  description: text("description"),
  payload: text("payload", { mode: "json" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type AlgorithmAdjustment = typeof algorithmAdjustments.$inferSelect;
export type InsertAlgorithmAdjustment = typeof algorithmAdjustments.$inferInsert;

// ─── Webhooks ───
export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"),
  events: text("events", { mode: "json" }).notNull(),
  active: integer("active", { mode: "boolean" }).default(false).notNull(),
  createdById: integer("createdById").notNull(),
  lastTriggeredAt: integer("lastTriggeredAt", { mode: "timestamp" }),
  lastStatus: integer("lastStatus"),
  failCount: integer("failCount").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ─── Webhook Delivery Log ───
export const webhookDeliveries = sqliteTable("webhookDeliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: integer("webhookId").notNull(),
  event: text("event").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  responseStatus: integer("responseStatus"),
  responseBody: text("responseBody"),
  success: integer("success", { mode: "boolean" }).default(false).notNull(),
  attemptNumber: integer("attemptNumber").default(1).notNull(),
  deliveredAt: integer("deliveredAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// ─── SEO Audits ───
export const seoAudits = sqliteTable("seoAudits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId"),
  shopName: text("shopName"),
  websiteUrl: text("websiteUrl").notNull(),
  city: text("city"),
  surroundingAreas: text("surroundingAreas", { mode: "json" }),
  targetKeywords: text("targetKeywords", { mode: "json" }),
  websiteAudit: text("websiteAudit", { mode: "json" }),
  fullSiteAudit: text("fullSiteAudit", { mode: "json" }),
  localSeoChecklist: text("localSeoChecklist", { mode: "json" }),
  keywordAnalysis: text("keywordAnalysis", { mode: "json" }),
  competitorComparison: text("competitorComparison", { mode: "json" }),
  gbpAudit: text("gbpAudit", { mode: "json" }),
  contentGapAnalysis: text("contentGapAnalysis", { mode: "json" }),
  reviewAnalysis: text("reviewAnalysis", { mode: "json" }),
  citationCheck: text("citationCheck", { mode: "json" }),
  websiteScore: real("websiteScore"),
  localSeoScore: real("localSeoScore"),
  keywordScore: real("keywordScore"),
  competitorScore: real("competitorScore"),
  gbpScore: real("gbpScore"),
  contentGapScore: real("contentGapScore"),
  reviewScore: real("reviewScore"),
  citationScore: real("citationScore"),
  overallScore: real("overallScore"),
  auditedById: integer("auditedById").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SeoAudit = typeof seoAudits.$inferSelect;
export type InsertSeoAudit = typeof seoAudits.$inferInsert;

// ─── Assessment Templates ───
export const assessmentTemplates = sqliteTable("assessmentTemplates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  scores: text("scores", { mode: "json" }).notNull(),
  businessProfile: text("businessProfile", { mode: "json" }),
  revenueTier: text("revenueTier"),
  createdById: integer("createdById").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type InsertAssessmentTemplate = typeof assessmentTemplates.$inferInsert;

// ─── Industry Benchmarks ───
export const industryBenchmarks = sqliteTable("industryBenchmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  metric: text("metric").notNull(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  source: text("source"),
  region: text("region"),
  shopTier: text("shopTier"),
  notes: text("notes"),
  createdById: integer("createdById").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type IndustryBenchmark = typeof industryBenchmarks.$inferSelect;
export type InsertIndustryBenchmark = typeof industryBenchmarks.$inferInsert;

// ─── Onboarding Checklist Templates ───
export const onboardingTemplates = sqliteTable("onboardingTemplates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  items: text("items", { mode: "json" }).notNull(),
  createdById: integer("createdById").notNull(),
  isDefault: integer("isDefault", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = typeof onboardingTemplates.$inferInsert;

// ─── Onboarding Checklists ───
export const onboardingChecklists = sqliteTable("onboardingChecklists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId").notNull(),
  templateId: integer("templateId"),
  name: text("name").notNull(),
  items: text("items", { mode: "json" }).notNull(),
  progress: real("progress").default(0).notNull(),
  assignedById: integer("assignedById").notNull(),
  startedAt: integer("startedAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist = typeof onboardingChecklists.$inferInsert;

// ─── Trusted Installer Directory ───
export const directoryEntries = sqliteTable("directoryEntries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  website: text("website"),
  contactName: text("contactName"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  location: text("location"),
  logoUrl: text("logoUrl"),
  rating: real("rating"),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  approved: integer("approved", { mode: "boolean" }).default(false).notNull(),
  accessLevel: text("accessLevel", { enum: ["public", "customer", "installer"] }).default("customer").notNull(),
  tags: text("tags", { mode: "json" }),
  notes: text("notes"),
  createdById: integer("createdById").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type DirectoryEntry = typeof directoryEntries.$inferSelect;
export type InsertDirectoryEntry = typeof directoryEntries.$inferInsert;

// ─── Sales Data ───
export const salesData = sqliteTable("salesData", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId"),
  shopName: text("shopName"),
  periodStart: text("periodStart").notNull(),
  periodEnd: text("periodEnd").notNull(),
  periodType: text("periodType").notNull(),
  totalRevenue: real("totalRevenue"),
  serviceRevenue: real("serviceRevenue"),
  productRevenue: real("productRevenue"),
  totalDeals: integer("totalDeals"),
  totalLeads: integer("totalLeads"),
  closeRate: real("closeRate"),
  avgTicketSize: real("avgTicketSize"),
  newCustomers: integer("newCustomers"),
  returningCustomers: integer("returningCustomers"),
  rebookingRate: real("rebookingRate"),
  adSpend: real("adSpend"),
  costPerLead: real("costPerLead"),
  costPerAcquisition: real("costPerAcquisition"),
  avgJobDuration: real("avgJobDuration"),
  utilizationRate: real("utilizationRate"),
  totalCommissions: real("totalCommissions"),
  rawPayload: text("rawPayload", { mode: "json" }),
  source: text("source").notNull(),
  externalId: text("externalId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SalesData = typeof salesData.$inferSelect;
export type InsertSalesData = typeof salesData.$inferInsert;

// ─── Sales Team Member Snapshots ───
export const salesTeamSnapshots = sqliteTable("salesTeamSnapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  salesDataId: integer("salesDataId"),
  memberName: text("memberName").notNull(),
  memberExternalId: text("memberExternalId"),
  memberRole: text("memberRole"),
  dealsCount: integer("dealsCount"),
  leadsAssigned: integer("leadsAssigned"),
  leadsConverted: integer("leadsConverted"),
  personalCloseRate: real("personalCloseRate"),
  revenue: real("revenue"),
  avgTicketSize: real("avgTicketSize"),
  commissionRate: real("commissionRate"),
  commissionEarned: real("commissionEarned"),
  bonuses: real("bonuses"),
  totalPay: real("totalPay"),
  callsMade: integer("callsMade"),
  followUpsSent: integer("followUpsSent"),
  appointmentsSet: integer("appointmentsSet"),
  appointmentsKept: integer("appointmentsKept"),
  rawPayload: text("rawPayload", { mode: "json" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SalesTeamSnapshot = typeof salesTeamSnapshots.$inferSelect;
export type InsertSalesTeamSnapshot = typeof salesTeamSnapshots.$inferInsert;

// ─── API Keys ───
export const apiKeys = sqliteTable("apiKeys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull(),
  keyPrefix: text("keyPrefix").notNull(),
  permissions: text("permissions", { mode: "json" }).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp" }),
  createdById: integer("createdById").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Leads ───
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  shopName: text("shopName"),
  scores: text("scores", { mode: "json" }),
  overallPercentage: real("overallPercentage"),
  pillarResults: text("pillarResults", { mode: "json" }),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  source: text("source").default("self-assessment").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Self Assessments ───
export const selfAssessments = sqliteTable("self_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId"),
  email: text("email"),
  scores: text("scores", { mode: "json" }).notNull(),
  overallScore: real("overallScore").notNull(),
  source: text("source", { enum: ["quiz", "portal"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
export type SelfAssessment = typeof selfAssessments.$inferSelect;
export type InsertSelfAssessment = typeof selfAssessments.$inferInsert;

// ─── System Settings ───
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  updatedById: integer("updatedById"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
