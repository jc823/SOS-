/**
 * Change Intelligence Engine
 * Analyzes differences between two assessments to generate
 * a progress report with grades, deltas, and insights.
 */
import { computeSOS, computeScalingProbability, type SubcategoryInput, type RevenueTier } from "./sos-engine";
import type { BusinessProfile } from "@shared/business-profile";

export type ProgressGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

export interface SubcategoryDelta {
  id: string;
  label: string;
  pillarId: string;
  pillarLabel: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  improved: boolean;
  regressed: boolean;
}

export interface PillarDelta {
  id: string;
  label: string;
  previousPercentage: number;
  currentPercentage: number;
  delta: number;
}

export interface ProfileDelta {
  label: string;
  previousValue: string;
  currentValue: string;
  isImprovement: boolean;
}

export interface ChangeIntelligenceReport {
  progressGrade: ProgressGrade;
  gradeRationale: string;

  previousDate: string;
  currentDate: string;
  daysBetween: number;

  improved: number;
  declined: number;
  unchangedCount: number;

  currentOverallPercentage: number;
  previousOverallPercentage: number;
  overallDelta: number;

  currentProbability: number;
  previousProbability: number;
  probabilityDelta: number;

  monthlyImprovementRate: number;
  projectedMonthsToGoal: number | null;

  previousRevenue: number | null;
  currentRevenue: number | null;
  revenueDelta: number | null;

  subcategoryDeltas: SubcategoryDelta[];
  pillarDeltas: PillarDelta[];

  topImprovements: SubcategoryDelta[];
  topRegressions: SubcategoryDelta[];

  resolvedBottlenecks: Array<{ id: string; label: string }>;
  newBottlenecks: Array<{ id: string; label: string }>;
  persistentBottlenecks: Array<{ id: string; label: string }>;

  profileDeltas: ProfileDelta[];

  executiveSummary: string;

  // Legacy compatibility
  improvementRatePerMonth: number;
  daysSinceLastAssessment: number;
  revenueActual: number | null;
  revenuePredicted: number | null;
  timeToGoalMonths: number | null;
  profileChanges: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDaysBetween(a: string, b: string): number {
  return Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

function scoreGrade(overallDelta: number, months: number): ProgressGrade {
  const rate = months > 0 ? overallDelta / months : 0;
  if (rate >= 5) return "A+";
  if (rate >= 3) return "A";
  if (rate >= 2) return "B+";
  if (rate >= 1) return "B";
  if (rate >= 0) return "C+";
  if (rate >= -0.5) return "C";
  if (rate >= -1) return "D";
  return "F";
}

function buildGradeRationale(grade: ProgressGrade, improved: number, declined: number, months: number): string {
  const period = months < 1.5 ? "this month" : `over ${Math.round(months)} months`;
  switch (grade) {
    case "A+": return `Exceptional improvement ${period} — ${improved} areas strengthened significantly.`;
    case "A": return `Strong progress ${period} with ${improved} areas improved and only ${declined} regressions.`;
    case "B+": return `Good progress ${period} — steady gains across ${improved} areas.`;
    case "B": return `Solid improvement ${period}. Keep the momentum going.`;
    case "C+": return `Modest gains ${period}. Some areas improved but more focus is needed.`;
    case "C": return `Minimal change ${period}. The recommended improvements haven't been fully implemented.`;
    case "D": return `Some decline ${period}. ${declined} areas regressed — review priorities immediately.`;
    case "F": return `Significant decline ${period}. Urgent action needed across ${declined} areas.`;
  }
}

function detectProfileDeltas(
  prev: BusinessProfile | null | undefined,
  curr: BusinessProfile | null | undefined,
): ProfileDelta[] {
  if (!prev || !curr) return [];
  const deltas: ProfileDelta[] = [];

  const prevAdSpend = (prev.adSpend.googleAds ?? 0) + (prev.adSpend.facebookMeta ?? 0);
  const currAdSpend = (curr.adSpend.googleAds ?? 0) + (curr.adSpend.facebookMeta ?? 0);
  if (Math.abs(currAdSpend - prevAdSpend) > 100) {
    deltas.push({
      label: "Monthly Ad Spend",
      previousValue: `$${prevAdSpend.toLocaleString()}`,
      currentValue: `$${currAdSpend.toLocaleString()}`,
      isImprovement: currAdSpend > prevAdSpend,
    });
  }

  const prevEmp = (prev.employees.detailers.count ?? 0) + (prev.employees.salesFrontDesk.count ?? 0);
  const currEmp = (curr.employees.detailers.count ?? 0) + (curr.employees.salesFrontDesk.count ?? 0);
  if (currEmp !== prevEmp) {
    deltas.push({
      label: "Team Size",
      previousValue: `${prevEmp} members`,
      currentValue: `${currEmp} members`,
      isImprovement: currEmp > prevEmp,
    });
  }

  const newServices = (curr.serviceFocus ?? []).filter(s => !(prev.serviceFocus ?? []).includes(s));
  if (newServices.length > 0) {
    deltas.push({
      label: "New Services Added",
      previousValue: "N/A",
      currentValue: newServices.join(", "),
      isImprovement: true,
    });
  }

  if (prev.averageTicketSize != null && curr.averageTicketSize != null && curr.averageTicketSize !== prev.averageTicketSize) {
    deltas.push({
      label: "Avg Ticket Size",
      previousValue: `$${prev.averageTicketSize}`,
      currentValue: `$${curr.averageTicketSize}`,
      isImprovement: curr.averageTicketSize > prev.averageTicketSize,
    });
  }

  return deltas;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateChangeIntelligence(
  prevInputs: Record<string, SubcategoryInput>,
  currInputs: Record<string, SubcategoryInput>,
  prevDate: string,
  currDate: string,
  tier: RevenueTier,
  customTarget?: number,
  prevRevenue?: number,
  currRevenue?: number,
  prevProfile?: BusinessProfile | null,
  currProfile?: BusinessProfile | null,
): ChangeIntelligenceReport {
  const days = calcDaysBetween(prevDate, currDate);
  const months = Math.max(1, days / 30);

  // Compute SOS results
  const prevResult = computeSOS(prevInputs);
  const currResult = computeSOS(currInputs);

  const prevProb = computeScalingProbability(prevResult, tier, customTarget);
  const currProb = computeScalingProbability(currResult, tier, customTarget);

  const currentOverallPercentage = currResult.percentage;
  const previousOverallPercentage = prevResult.percentage;
  const overallDelta = currentOverallPercentage - previousOverallPercentage;
  const currentProbability = currProb.overall;
  const previousProbability = prevProb.overall;
  const probabilityDelta = currentProbability - previousProbability;
  const monthlyImprovementRate = Math.round((overallDelta / months) * 100) / 100;

  // Build a label map from SOS results
  const subLabelMap: Record<string, { label: string; pillarId: string; pillarLabel: string }> = {};
  for (const pillar of currResult.pillars) {
    for (const sub of pillar.subcategories) {
      subLabelMap[sub.id] = { label: sub.label, pillarId: sub.pillarId, pillarLabel: sub.pillarLabel };
    }
  }
  for (const pillar of prevResult.pillars) {
    for (const sub of pillar.subcategories) {
      if (!subLabelMap[sub.id]) {
        subLabelMap[sub.id] = { label: sub.label, pillarId: sub.pillarId, pillarLabel: sub.pillarLabel };
      }
    }
  }

  // Per-subcategory deltas
  const allIds = new Set([...Object.keys(prevInputs), ...Object.keys(currInputs)]);
  const subcategoryDeltas: SubcategoryDelta[] = Array.from(allIds).map(id => {
    const prev = prevInputs[id]?.score ?? 0;
    const curr = currInputs[id]?.score ?? 0;
    const meta = subLabelMap[id] ?? { label: id, pillarId: "", pillarLabel: "" };
    return {
      id,
      label: meta.label,
      pillarId: meta.pillarId,
      pillarLabel: meta.pillarLabel,
      previousScore: prev,
      currentScore: curr,
      delta: curr - prev,
      improved: curr > prev,
      regressed: curr < prev,
    };
  });

  const improved = subcategoryDeltas.filter(d => d.improved).length;
  const declined = subcategoryDeltas.filter(d => d.regressed).length;
  const unchangedCount = subcategoryDeltas.length - improved - declined;

  const topImprovements = [...subcategoryDeltas].filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const topRegressions = [...subcategoryDeltas].filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);

  // Pillar deltas
  const pillarDeltas: PillarDelta[] = currResult.pillars.map(cp => {
    const pp = prevResult.pillars.find(p => p.id === cp.id);
    const prevPct = pp?.percentage ?? 0;
    return {
      id: cp.id,
      label: cp.label,
      previousPercentage: prevPct,
      currentPercentage: cp.percentage,
      delta: cp.percentage - prevPct,
    };
  });

  // Bottleneck analysis
  const prevBottleneckIds = new Set(prevResult.bottlenecks.map(b => b.id));
  const currBottleneckIds = new Set(currResult.bottlenecks.map(b => b.id));

  const resolvedBottlenecks = prevResult.bottlenecks
    .filter(b => !currBottleneckIds.has(b.id))
    .map(b => ({ id: b.id, label: b.label }));

  const newBottlenecks = currResult.bottlenecks
    .filter(b => !prevBottleneckIds.has(b.id))
    .map(b => ({ id: b.id, label: b.label }));

  const persistentBottlenecks = currResult.bottlenecks
    .filter(b => prevBottleneckIds.has(b.id))
    .map(b => ({ id: b.id, label: b.label }));

  // Profile changes
  const profileDeltas = detectProfileDeltas(prevProfile, currProfile);
  const profileChanges = profileDeltas.map(d => `${d.label}: ${d.previousValue} → ${d.currentValue}`);

  // Revenue
  const prevRev = prevRevenue ?? null;
  const currRev = currRevenue ?? null;
  const revenueDelta = prevRev != null && currRev != null ? currRev - prevRev : null;

  // Grade
  const progressGrade = scoreGrade(overallDelta, months);
  const gradeRationale = buildGradeRationale(progressGrade, improved, declined, months);

  // Projected months to goal (80% = scaling)
  const goalPct = 80;
  const projectedMonthsToGoal = monthlyImprovementRate > 0 && currentOverallPercentage < goalPct
    ? Math.ceil((goalPct - currentOverallPercentage) / monthlyImprovementRate)
    : monthlyImprovementRate < 0
    ? null
    : currentOverallPercentage >= goalPct ? 0 : null;

  // Executive summary
  let executiveSummary = "";
  if (overallDelta > 10) {
    executiveSummary = `Strong progress — ${improved} areas improved significantly over ${Math.round(months)} months.`;
  } else if (overallDelta > 0) {
    executiveSummary = `Moderate improvement — consistent gains in ${improved} key areas.`;
  } else if (overallDelta === 0) {
    executiveSummary = `No significant changes detected since last assessment. Focus on implementing quick wins.`;
  } else {
    executiveSummary = `Some regressions detected in ${declined} areas — review and re-prioritize.`;
  }

  return {
    progressGrade,
    gradeRationale,
    previousDate: prevDate,
    currentDate: currDate,
    daysBetween: days,
    improved,
    declined,
    unchangedCount,
    currentOverallPercentage,
    previousOverallPercentage,
    overallDelta,
    currentProbability,
    previousProbability,
    probabilityDelta,
    monthlyImprovementRate,
    projectedMonthsToGoal: projectedMonthsToGoal ?? null,
    previousRevenue: prevRev,
    currentRevenue: currRev,
    revenueDelta,
    subcategoryDeltas,
    pillarDeltas,
    topImprovements,
    topRegressions,
    resolvedBottlenecks,
    newBottlenecks,
    persistentBottlenecks,
    profileDeltas,
    executiveSummary,
    // Legacy
    improvementRatePerMonth: monthlyImprovementRate,
    daysSinceLastAssessment: days,
    revenueActual: currRev,
    revenuePredicted: prevRev,
    timeToGoalMonths: projectedMonthsToGoal ?? null,
    profileChanges,
  };
}
