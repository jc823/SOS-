/**
 * Cost Engine v2 — True Cost of Inaction
 * Uses real revenue inputs (currentRevenue, goalRevenue) to model
 * what staying stuck costs vs implementing Scale's methodology.
 */
import type { SOSResult, ScalingProbability, RevenueTier } from "./sos-engine";

export type Severity = "critical" | "significant" | "moderate" | "low";

export interface PillarCost {
  pillarId: string;
  pillarLabel: string;
  monthlyLoss: number;
  annualLoss: number;
  recommendation: string;
}

export interface PillarBreakdown {
  pillarId: string;
  pillarLabel: string;
  potentialGain: number;
  currentScore: number;
  topSubcategory: string;
  topSubcategoryGain: number;
}

export interface CostOfNotChanging {
  // Revenue gap
  currentRevenue: number;
  goalRevenue: number;
  monthlyGap: number;

  // Severity rating
  severity: Severity;
  severityLabel: string;
  tierLabel: string;
  isRealData: boolean;

  // Projections — if they do NOTHING (erosion)
  erosion3mo: number;
  erosion6mo: number;
  erosion12mo: number;

  // Projections — if they implement
  implement3mo: number;
  implement6mo: number;
  implement12mo: number;

  // Cumulative gap
  totalGapOverYear: number;

  // Opportunity cost aliases
  opportunityCost3Month: number;
  opportunityCost6Month: number;
  opportunityCost12Month: number;

  // Inaction cost (erosion only)
  inactionMonthlyDecline: number;
  inaction3Month: number;
  inaction6Month: number;
  inaction12Month: number;

  // Probability
  probabilityOfSuccess: number;
  expectedRevenueAtCurrentScores: number;

  // Quick wins
  quickWinMonthly: number;
  quickWinAnnual: number;
  quickWinActions: string[];

  // Per-pillar breakdown
  pillarCosts: PillarCost[];
  pillarBreakdowns: PillarBreakdown[];
}

export interface TrajectoryPoint {
  month: number;
  implementRevenue: number;
  doNothingRevenue: number;
}

export interface TrajectoryData {
  points: TrajectoryPoint[];
  finalImplement: number;
  finalDoNothing: number;
  maxRevenue: number;
  minRevenue: number;
  cumulativeGap: number;
  currentRevenue: number;
  goalRevenue: number;
}

// ─── Revenue tier midpoints ────────────────────────────────────────────────
const TIER_MIDPOINTS: Record<string, number> = {
  "20-30": 25000,
  "30-40": 35000,
  "40-50": 45000,
};

function getTierMidpoint(tier: RevenueTier): number {
  return TIER_MIDPOINTS[tier] ?? 25000;
}

const TIER_LABELS: Record<string, string> = {
  "20-30": "$20k–$30k",
  "30-40": "$30k–$40k",
  "40-50": "$40k–$50k",
  "custom": "Custom",
};

// ─── Per-pillar opportunity estimates ────────────────────────────────────────
const PILLAR_LABELS: Record<string, string> = {
  services: "Services",
  sales: "Sales",
  ads: "Ads & Marketing",
  team: "Team & Ops",
};

const PILLAR_QUICK_WIN_RECS: Record<string, string> = {
  services: "Standardize your menu & pricing — add 3 premium add-ons",
  sales: "Implement a 24-hr lead follow-up system",
  ads: "Launch a Google LSA campaign with $500/mo to start",
  team: "Create one repeatable SOPs document this week",
};

export function computeCostOfNotChanging(
  result: SOSResult,
  probability: ScalingProbability,
  tier: RevenueTier,
  customTarget?: number,
  currentRevenue?: number,
  goalRevenue?: number,
): CostOfNotChanging {
  const isRealData = currentRevenue !== undefined && goalRevenue !== undefined;
  const current = currentRevenue ?? Math.round(getTierMidpoint(tier) * 0.6);
  const goal = goalRevenue ?? customTarget ?? getTierMidpoint(tier);
  const monthlyGap = Math.max(0, goal - current);
  const tierLabel = probability.tierLabel ?? TIER_LABELS[tier] ?? tier;

  // Severity based on gap size relative to current revenue
  const gapRatio = current > 0 ? monthlyGap / current : 1;
  let severity: Severity = "low";
  if (gapRatio >= 1.0) severity = "critical";
  else if (gapRatio >= 0.5) severity = "significant";
  else if (gapRatio >= 0.25) severity = "moderate";
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);

  // Erosion: market erosion + stagnation penalty
  const erosionRate = 0.005; // 0.5%/month decline if nothing changes
  const erosion3mo = current * Math.pow(1 - erosionRate, 3);
  const erosion6mo = current * Math.pow(1 - erosionRate, 6);
  const erosion12mo = current * Math.pow(1 - erosionRate, 12);

  // Inaction costs (cumulative decline over period)
  const inactionMonthlyDecline = Math.round(current * erosionRate);
  const inaction3Month = Math.round(current - erosion3mo);
  const inaction6Month = Math.round(current - erosion6mo);
  const inaction12Month = Math.round(current - erosion12mo);

  // Growth: S-curve based on probability
  const prob = probability.overall / 100;
  const growthCapacity = monthlyGap * prob * 0.8;
  const implement3mo = current + growthCapacity * 0.3;
  const implement6mo = current + growthCapacity * 0.6;
  const implement12mo = current + growthCapacity * 1.0;

  const totalGapOverYear = Math.round((implement12mo - erosion12mo) * 12);

  // Expected revenue at current scores
  const expectedRevenueAtCurrentScores = Math.round(current + monthlyGap * prob);
  const probabilityOfSuccess = probability.overall;

  // Per-pillar breakdown
  const pillarCosts: PillarCost[] = result.pillars.map((pillar) => {
    const gapContribution = monthlyGap * (1 - pillar.percentage / 100) * 0.25;
    return {
      pillarId: pillar.id,
      pillarLabel: PILLAR_LABELS[pillar.id] ?? pillar.label,
      monthlyLoss: Math.round(gapContribution),
      annualLoss: Math.round(gapContribution * 12),
      recommendation: PILLAR_QUICK_WIN_RECS[pillar.id] ?? "Review and improve this area",
    };
  });

  const pillarBreakdowns: PillarBreakdown[] = result.pillars.map((pillar) => {
    const potentialGain = monthlyGap * (1 - pillar.percentage / 100) * 0.25;
    const weakestSub = [...pillar.subcategories].sort((a, b) => a.normalized - b.normalized)[0];
    return {
      pillarId: pillar.id,
      pillarLabel: PILLAR_LABELS[pillar.id] ?? pillar.label,
      potentialGain: Math.round(potentialGain),
      currentScore: pillar.percentage,
      topSubcategory: weakestSub?.label ?? "N/A",
      topSubcategoryGain: weakestSub ? Math.round(potentialGain * 0.4) : 0,
    };
  });

  // Quick wins: top 2 weakest pillars
  const sorted = [...pillarCosts].sort((a, b) => b.monthlyLoss - a.monthlyLoss);
  const quickWinMonthly = sorted.slice(0, 2).reduce((s, p) => s + p.monthlyLoss * 0.4, 0);

  // Opportunity cost = cumulative gap to implement path (what's being lost by not starting)
  const opp3mo = Math.max(0, (implement3mo - current) * 3 - (erosion3mo - current) * 3) || Math.round(monthlyGap * 3 * 0.3);
  const opp6mo = Math.max(0, (implement6mo - current) * 6 - (erosion6mo - current) * 6) || Math.round(monthlyGap * 6 * 0.5);
  const opp12mo = Math.max(0, (implement12mo - current) * 12 - (erosion12mo - current) * 12) || Math.round(monthlyGap * 12 * 0.8);

  return {
    currentRevenue: current,
    goalRevenue: goal,
    monthlyGap,
    severity,
    severityLabel,
    tierLabel,
    isRealData,
    erosion3mo: Math.round(erosion3mo),
    erosion6mo: Math.round(erosion6mo),
    erosion12mo: Math.round(erosion12mo),
    implement3mo: Math.round(implement3mo),
    implement6mo: Math.round(implement6mo),
    implement12mo: Math.round(implement12mo),
    totalGapOverYear: Math.max(0, totalGapOverYear),
    opportunityCost3Month: Math.round(opp3mo),
    opportunityCost6Month: Math.round(opp6mo),
    opportunityCost12Month: Math.round(opp12mo),
    inactionMonthlyDecline,
    inaction3Month,
    inaction6Month,
    inaction12Month,
    probabilityOfSuccess,
    expectedRevenueAtCurrentScores,
    quickWinMonthly: Math.round(quickWinMonthly),
    quickWinAnnual: Math.round(quickWinMonthly * 12),
    quickWinActions: sorted.slice(0, 2).map((p) => p.recommendation),
    pillarCosts,
    pillarBreakdowns,
  };
}

// ─── Trajectory chart data ─────────────────────────────────────────────────
export function computeTrajectoryData(
  cost: CostOfNotChanging,
  overallPercentage: number,
): TrajectoryData {
  const erosionRate = 0.005;
  const prob = overallPercentage / 100;
  const growthCapacity = (cost.goalRevenue - cost.currentRevenue) * prob * 0.8;

  const points: TrajectoryPoint[] = Array.from({ length: 13 }, (_, m) => {
    const doNothingRevenue = Math.round(cost.currentRevenue * Math.pow(1 - erosionRate, m));
    const t = m / 12;
    const sCurve = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const implementRevenue = Math.round(cost.currentRevenue + growthCapacity * sCurve);
    return { month: m, implementRevenue, doNothingRevenue };
  });

  const finalImplement = points[12]?.implementRevenue ?? cost.currentRevenue;
  const finalDoNothing = points[12]?.doNothingRevenue ?? cost.currentRevenue;

  const allRevenues = points.flatMap(p => [p.implementRevenue, p.doNothingRevenue, cost.goalRevenue]);
  const maxRevenue = Math.max(...allRevenues);
  const minRevenue = Math.min(...allRevenues);

  // Cumulative gap = sum of monthly differences over 12 months
  const cumulativeGap = Math.round(
    points.slice(1).reduce((sum, p) => sum + Math.max(0, p.implementRevenue - p.doNothingRevenue), 0)
  );

  return {
    points,
    finalImplement,
    finalDoNothing,
    maxRevenue,
    minRevenue,
    cumulativeGap,
    currentRevenue: cost.currentRevenue,
    goalRevenue: cost.goalRevenue,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "#E74C3C";
    case "significant":
      return "#E67E22";
    case "moderate":
      return "#F39C12";
    case "low":
      return "#27AE60";
  }
}
