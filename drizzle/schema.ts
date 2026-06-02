import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  username: text("username").unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  shopId: integer("shopId"),
  magicLinkToken: text("magicLinkToken"),
  magicLinkExpiry: timestamp("magicLinkExpiry"),
  stripeCustomerId: text("stripeCustomerId"),
  subscriptionStatus: text("subscriptionStatus").default("free").notNull(),
  subscriptionId: text("subscriptionId"),
  subscriptionPeriodEnd: timestamp("subscriptionPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Invites ───
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdById: integer("createdById").notNull(),
  usedById: integer("usedById"),
  role: text("role").default("user").notNull(),
  shopId: integer("shopId"),
  expiresAt: timestamp("expiresAt"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

// ─── Shops ───
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  contactName: text("contactName"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  notes: text("notes"),
  logoUrl: text("logoUrl"),
  createdById: integer("createdById").notNull(),
  resultsUnlocked: boolean("resultsUnlocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Shop = typeof shops.$inferSelect;
export type InsertShop = typeof shops.$inferInsert;

// ─── Assessments ───
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  shopId: integer("shopId").notNull(),
  assessorId: integer("assessorId").notNull(),
  assessorName: text("assessorName").notNull(),
  assessmentType: text("assessmentType").default("assessment").notNull(),
  assessmentDate: text("assessmentDate").notNull(),
  revenueTier: text("revenueTier").notNull(),
  customTarget: integer("customTarget"),
  notes: text("notes"),
  overallPercentage: real("overallPercentage").notNull(),
  overallBand: text("overallBand").notNull(),
  scalingProbability: real("scalingProbability").notNull(),
  scores: jsonb("scores").notNull(),
  pillarResults: jsonb("pillarResults").notNull(),
  bottlenecks: jsonb("bottlenecks").notNull(),
  topLeveragePriorities: jsonb("topLeveragePriorities").notNull(),
  actionPlan: jsonb("actionPlan"),
  currentRevenue: integer("currentRevenue"),
  goalRevenue: integer("goalRevenue"),
  businessProfile: jsonb("businessProfile"),
  previousAssessmentId: integer("previousAssessmentId"),
  actualRevenue: integer("actualRevenue"),
  predictions: text("predictions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ─── Outcomes ───
export const outcomes = pgTable("outcomes", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessmentId").notNull(),
  shopId: integer("shopId").notNull(),
  hitTarget: text("hitTarget").notNull(),
  actualRevenue: integer("actualRevenue"),
  monthsElapsed: integer("monthsElapsed"),
  notes: text("notes"),
  loggedById: integer("loggedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Outcome = typeof outcomes.$inferSelect;
export type InsertOutcome = typeof outcomes.$inferInsert;

// ─── Algorithm Adjustments ───
export const algorithmAdjustments = pgTable("algorithmAdjustments", {
  id: serial("id").primaryKey(),
  adjustmentType: text("adjustmentType").notNull(),
  pillarId: text("pillarId"),
  subcategoryId: text("subcategoryId"),
  previousValue: real("previousValue"),
  newValue: real("newValue"),
  confidence: real("confidence"),
  sampleSize: integer("sampleSize"),
  description: text("description"),
  payload: jsonb("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlgorithmAdjustment = typeof algorithmAdjustments.$inferSelect;
export type InsertAlgorithmAdjustment = typeof algorithmAdjustments.$inferInsert;

// ─── Webhooks ───
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"),
  events: jsonb("events").notNull(),
  active: boolean("active").default(false).notNull(),
  createdById: integer("createdById").notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  lastStatus: integer("lastStatus"),
  failCount: integer("failCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ─── Webhook Delivery Log ───
export const webhookDeliveries = pgTable("webhookDeliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhookId").notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("responseStatus"),
  responseBody: text("responseBody"),
  success: boolean("success").default(false).notNull(),
  attemptNumber: integer("attemptNumber").default(1).notNull(),
  deliveredAt: timestamp("deliveredAt").defaultNow().notNull(),
});

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// ─── SEO Audits ───
export const seoAudits = pgTable("seoAudits", {
  id: serial("id").primaryKey(),
  shopId: integer("shopId"),
  shopName: text("shopName"),
  websiteUrl: text("websiteUrl").notNull(),
  city: text("city"),
  surroundingAreas: jsonb("surroundingAreas"),
  targetKeywords: jsonb("targetKeywords"),
  websiteAudit: jsonb("websiteAudit"),
  fullSiteAudit: jsonb("fullSiteAudit"),
  localSeoChecklist: jsonb("localSeoChecklist"),
  keywordAnalysis: jsonb("keywordAnalysis"),
  competitorComparison: jsonb("competitorComparison"),
  gbpAudit: jsonb("gbpAudit"),
  contentGapAnalysis: jsonb("contentGapAnalysis"),
  reviewAnalysis: jsonb("reviewAnalysis"),
  citationCheck: jsonb("citationCheck"),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SeoAudit = typeof seoAudits.$inferSelect;
export type InsertSeoAudit = typeof seoAudits.$inferInsert;

// ─── Assessment Templates ───
export const assessmentTemplates = pgTable("assessmentTemplates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  scores: jsonb("scores").notNull(),
  businessProfile: jsonb("businessProfile"),
  revenueTier: text("revenueTier"),
  createdById: integer("createdById").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type InsertAssessmentTemplate = typeof assessmentTemplates.$inferInsert;

// ─── Industry Benchmarks ───
export const industryBenchmarks = pgTable("industryBenchmarks", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type IndustryBenchmark = typeof industryBenchmarks.$inferSelect;
export type InsertIndustryBenchmark = typeof industryBenchmarks.$inferInsert;

// ─── Onboarding Checklist Templates ───
export const onboardingTemplates = pgTable("onboardingTemplates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  items: jsonb("items").notNull(),
  createdById: integer("createdById").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type InsertOnboardingTemplate = typeof onboardingTemplates.$inferInsert;

// ─── Onboarding Checklists ───
export const onboardingChecklists = pgTable("onboardingChecklists", {
  id: serial("id").primaryKey(),
  shopId: integer("shopId").notNull(),
  templateId: integer("templateId"),
  name: text("name").notNull(),
  items: jsonb("items").notNull(),
  progress: real("progress").default(0).notNull(),
  assignedById: integer("assignedById").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OnboardingChecklist = typeof onboardingChecklists.$inferSelect;
export type InsertOnboardingChecklist = typeof onboardingChecklists.$inferInsert;

// ─── Trusted Installer Directory ───
export const directoryEntries = pgTable("directoryEntries", {
  id: serial("id").primaryKey(),
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
  featured: boolean("featured").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  accessLevel: text("accessLevel").default("customer").notNull(),
  tags: jsonb("tags"),
  notes: text("notes"),
  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DirectoryEntry = typeof directoryEntries.$inferSelect;
export type InsertDirectoryEntry = typeof directoryEntries.$inferInsert;

// ─── Sales Data ───
export const salesData = pgTable("salesData", {
  id: serial("id").primaryKey(),
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
  rawPayload: jsonb("rawPayload"),
  source: text("source").notNull(),
  externalId: text("externalId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SalesData = typeof salesData.$inferSelect;
export type InsertSalesData = typeof salesData.$inferInsert;

// ─── Sales Team Member Snapshots ───
export const salesTeamSnapshots = pgTable("salesTeamSnapshots", {
  id: serial("id").primaryKey(),
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
  rawPayload: jsonb("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesTeamSnapshot = typeof salesTeamSnapshots.$inferSelect;
export type InsertSalesTeamSnapshot = typeof salesTeamSnapshots.$inferInsert;

// ─── API Keys ───
export const apiKeys = pgTable("apiKeys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("keyHash").notNull(),
  keyPrefix: text("keyPrefix").notNull(),
  permissions: jsonb("permissions").notNull(),
  active: boolean("active").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdById: integer("createdById").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Leads ───
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  shopName: text("shopName"),
  scores: jsonb("scores"),
  overallPercentage: real("overallPercentage"),
  pillarResults: jsonb("pillarResults"),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  source: text("source").default("self-assessment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Self Assessments ───
export const selfAssessments = pgTable("self_assessments", {
  id: serial("id").primaryKey(),
  shopId: integer("shopId"),
  email: text("email"),
  scores: jsonb("scores").notNull(),
  overallScore: real("overallScore").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SelfAssessment = typeof selfAssessments.$inferSelect;
export type InsertSelfAssessment = typeof selfAssessments.$inferInsert;

// ─── System Settings ───
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  updatedById: integer("updatedById"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
