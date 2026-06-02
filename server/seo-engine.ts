/**
 * SEO Engine — Website audit and keyword analysis for auto detailing shops
 */

export interface PageAudit {
  url: string;
  title: string;
  path: string;
  wordCount: number;
  score: number;
  issues: string[];
  h1: string;
  metaDescription: string;
  hasStructuredData: boolean;
  loadTime?: number;
  mobileScore?: number;
}

export interface WebsiteAudit {
  url: string;
  score: number;
  issues: Array<{ severity: "critical" | "warning" | "info"; message: string; fix: string }>;
  metaTitle: string;
  metaDescription: string;
  h1Tags: string[];
  hasSSL: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  mobileScore: number;
  speedScore: number;
  structuredData: boolean;
  internalLinks: number;
  brokenLinks: number;
  wordCount: number;
  keywordDensity: Record<string, number>;
}

export interface FullSiteAudit {
  url: string;
  score: number;
  pagesAudited: number;
  pages: PageAudit[];
  totalIssues: number;
  criticalIssues: number;
  topIssues: string[];
}

export interface KeywordAnalysis {
  keywords: string[];
  found: Array<{ keyword: string; count: number; density: number; inTitle: boolean; inH1: boolean }>;
  missing: string[];
  score: number;
  recommendations: string[];
}

export interface LocalSeoChecklistItem {
  id: string;
  category: string;
  label: string;
  description: string;
  status: "pass" | "warn" | "fail";
  weight: number;
}

export async function runWebsiteAudit(url: string, _customKeywords: string[]): Promise<WebsiteAudit> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  let html = "";
  let hasSSL = normalizedUrl.startsWith("https://");
  let loadTime = 0;

  try {
    const start = Date.now();
    const res = await fetch(normalizedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ScaleDetailingSEOBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    loadTime = Date.now() - start;
    html = await res.text();
  } catch {
    // Return a stub if we can't fetch
    return buildStubWebsiteAudit(url);
  }

  const issues: WebsiteAudit["issues"] = [];

  // Extract meta title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaTitle = titleMatch?.[1]?.trim() ?? "";
  if (!metaTitle) issues.push({ severity: "critical", message: "Missing page title", fix: "Add a descriptive <title> tag" });
  else if (metaTitle.length < 30) issues.push({ severity: "warning", message: "Title too short", fix: "Expand title to 50-60 characters" });

  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const metaDescription = descMatch?.[1]?.trim() ?? "";
  if (!metaDescription) issues.push({ severity: "critical", message: "Missing meta description", fix: "Add a meta description tag" });

  // H1 tags
  const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi)].map(m => m[1]?.trim() ?? "");
  if (h1Matches.length === 0) issues.push({ severity: "critical", message: "No H1 tag found", fix: "Add an H1 with your primary keyword" });

  const hasStructuredData = html.includes('application/ld+json');
  if (!hasStructuredData) issues.push({ severity: "warning", message: "No structured data (Schema.org)", fix: "Add LocalBusiness schema markup" });

  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (wordCount < 300) issues.push({ severity: "warning", message: "Low word count", fix: "Add more descriptive content about your services" });

  const mobileScore = html.includes('viewport') ? 75 : 30;
  const speedScore = loadTime < 2000 ? 90 : loadTime < 4000 ? 65 : 40;

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 15;
    else if (issue.severity === "warning") score -= 8;
  }
  if (loadTime > 3000) score -= 10;

  return {
    url: normalizedUrl,
    score: Math.max(0, Math.min(100, score)),
    issues,
    metaTitle,
    metaDescription,
    h1Tags: h1Matches,
    hasSSL,
    hasSitemap: false,
    hasRobotsTxt: false,
    mobileScore,
    speedScore,
    structuredData: hasStructuredData,
    internalLinks: 0,
    brokenLinks: 0,
    wordCount,
    keywordDensity: {},
  };
}

function buildStubWebsiteAudit(url: string): WebsiteAudit {
  return {
    url,
    score: 40,
    issues: [{ severity: "critical", message: "Could not fetch website", fix: "Verify the website URL is accessible" }],
    metaTitle: "",
    metaDescription: "",
    h1Tags: [],
    hasSSL: false,
    hasSitemap: false,
    hasRobotsTxt: false,
    mobileScore: 0,
    speedScore: 0,
    structuredData: false,
    internalLinks: 0,
    brokenLinks: 0,
    wordCount: 0,
    keywordDensity: {},
  };
}

export async function crawlAndAuditSite(url: string, customKeywords: string[]): Promise<FullSiteAudit> {
  const homepage = await runWebsiteAudit(url, customKeywords);
  return {
    url,
    score: homepage.score,
    pagesAudited: 1,
    pages: [{
      url,
      title: homepage.metaTitle,
      path: "/",
      wordCount: homepage.wordCount,
      score: homepage.score,
      issues: homepage.issues.map(i => i.message),
      h1: homepage.h1Tags[0] ?? "",
      metaDescription: homepage.metaDescription,
      hasStructuredData: homepage.structuredData,
    }],
    totalIssues: homepage.issues.length,
    criticalIssues: homepage.issues.filter(i => i.severity === "critical").length,
    topIssues: homepage.issues.slice(0, 3).map(i => i.message),
  };
}

export function generateKeywordList(city: string, surroundingAreas: string[], customKeywords: string[]): string[] {
  const baseServices = ["auto detailing", "car detailing", "mobile detailing", "ceramic coating", "paint correction", "PPF", "window tint"];
  const keywords: string[] = [];
  for (const service of baseServices) {
    keywords.push(`${service} ${city}`);
  }
  for (const area of surroundingAreas.slice(0, 5)) {
    keywords.push(`auto detailing ${area}`, `car detailing ${area}`);
  }
  return [...new Set([...keywords, ...customKeywords])];
}

export function analyzeKeywords(html: string, keywords: string[]): KeywordAnalysis {
  const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = (titleMatch?.[1] ?? "").toLowerCase();
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const h1 = (h1Match?.[1] ?? "").toLowerCase();
  const words = text.split(/\s+/).length || 1;

  const found = keywords.map(kw => {
    const kwLower = kw.toLowerCase();
    const regex = new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (text.match(regex) ?? []).length;
    return {
      keyword: kw,
      count,
      density: Math.round((count / words) * 100 * 10) / 10,
      inTitle: title.includes(kwLower),
      inH1: h1.includes(kwLower),
    };
  });

  const missing = found.filter(f => f.count === 0).map(f => f.keyword);
  const score = Math.max(0, 100 - missing.length * (100 / Math.max(1, keywords.length)));

  return {
    keywords,
    found: found.filter(f => f.count > 0),
    missing,
    score: Math.round(score),
    recommendations: missing.slice(0, 5).map(k => `Add "${k}" to your page content`),
  };
}

export function calculateLocalSeoScore(checklist: LocalSeoChecklistItem[]): number {
  if (!checklist.length) return 0;
  const total = checklist.reduce((sum, item) => sum + item.weight, 0);
  const earned = checklist
    .filter(item => item.status === "pass")
    .reduce((sum, item) => sum + item.weight, 0);
  const partial = checklist
    .filter(item => item.status === "warn")
    .reduce((sum, item) => sum + item.weight * 0.5, 0);
  return Math.round(((earned + partial) / Math.max(1, total)) * 100);
}

export function getLocalSeoChecklist(): LocalSeoChecklistItem[] {
  return [
    { id: "gbp_claimed", category: "Google Business Profile", label: "GBP Claimed & Verified", description: "Google Business Profile is claimed and verified", status: "fail", weight: 20 },
    { id: "gbp_complete", category: "Google Business Profile", label: "GBP Profile Complete", description: "All profile sections filled in (hours, services, photos)", status: "fail", weight: 15 },
    { id: "reviews_count", category: "Reviews", label: "10+ Google Reviews", description: "Has at least 10 Google reviews", status: "fail", weight: 15 },
    { id: "reviews_rating", category: "Reviews", label: "4.5+ Star Rating", description: "Average rating is 4.5 stars or higher", status: "fail", weight: 10 },
    { id: "citations", category: "Citations", label: "Listed in Key Directories", description: "Listed in Yelp, Bing Places, Apple Maps", status: "fail", weight: 10 },
    { id: "nap_consistent", category: "Citations", label: "NAP Consistency", description: "Name, address, phone identical across directories", status: "fail", weight: 10 },
    { id: "local_pages", category: "Website", label: "Location Pages", description: "Has location-specific service pages", status: "fail", weight: 10 },
    { id: "schema", category: "Website", label: "LocalBusiness Schema", description: "Structured data markup implemented", status: "fail", weight: 5 },
    { id: "social_active", category: "Social", label: "Active Social Media", description: "Posts at least 2x per week", status: "fail", weight: 5 },
  ];
}
