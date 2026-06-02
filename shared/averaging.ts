/**
 * Assessment averaging utilities — groups and averages multiple assessments
 * within time windows to smooth out assessor variability.
 */

export interface AssessmentForAveraging {
  id: number;
  assessorName?: string | null;
  assessorId?: number | null;
  assessmentDate?: string | null;
  overallPercentage?: number | null;
  scalingProbability?: number | null;
  scores?: Record<string, { score: number }>;
  businessProfile?: unknown;
  currentRevenue?: number | null;
}

export interface AveragedAssessment {
  assessmentCount: number;
  isAveraged: boolean;
  assessorCount: number;
  assessorNames: string[];
  overallPercentage: number;
  scalingProbability: number;
  scores: Record<string, { score: number }>;
  dateRange: { from: string; to: string };
  currentRevenue: number | null;
  businessProfile?: unknown;
}

export function averageAssessments(assessments: AssessmentForAveraging[]): AveragedAssessment | null {
  if (!assessments.length) return null;

  const overallPct = assessments.reduce((sum, a) => sum + (a.overallPercentage ?? 0), 0) / assessments.length;
  const scalingProb = assessments.reduce((sum, a) => sum + (a.scalingProbability ?? 0), 0) / assessments.length;

  // Average scores per subcategory
  const scoreMap: Record<string, number[]> = {};
  for (const a of assessments) {
    for (const [key, val] of Object.entries(a.scores ?? {})) {
      if (!scoreMap[key]) scoreMap[key] = [];
      scoreMap[key].push(val.score);
    }
  }
  const scores: Record<string, { score: number }> = {};
  for (const [key, vals] of Object.entries(scoreMap)) {
    scores[key] = { score: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 };
  }

  const dates = assessments
    .map(a => a.assessmentDate)
    .filter((d): d is string => d != null)
    .sort();

  const revenues = assessments.map(a => a.currentRevenue).filter((r): r is number => r != null);
  const currentRevenue = revenues.length ? Math.round(revenues.reduce((s, v) => s + v, 0) / revenues.length) : null;

  const assessorNames = [...new Set(assessments.map(a => a.assessorName).filter((n): n is string => n != null))];

  return {
    assessmentCount: assessments.length,
    isAveraged: assessments.length > 1,
    assessorCount: assessorNames.length,
    assessorNames,
    overallPercentage: Math.round(overallPct * 10) / 10,
    scalingProbability: Math.round(scalingProb * 10) / 10,
    scores,
    dateRange: { from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" },
    currentRevenue,
    businessProfile: assessments[assessments.length - 1]?.businessProfile,
  };
}

export function groupAssessmentsByWindow(
  assessments: AssessmentForAveraging[],
  windowDays: number,
): AssessmentForAveraging[][] {
  if (!assessments.length) return [];

  const sorted = [...assessments].sort((a, b) => {
    const da = a.assessmentDate ? new Date(a.assessmentDate).getTime() : 0;
    const db = b.assessmentDate ? new Date(b.assessmentDate).getTime() : 0;
    return da - db;
  });

  const groups: AssessmentForAveraging[][] = [];
  let currentGroup: AssessmentForAveraging[] = [];
  let windowStart: number | null = null;

  for (const assessment of sorted) {
    const ts = assessment.assessmentDate ? new Date(assessment.assessmentDate).getTime() : 0;
    if (windowStart === null) {
      windowStart = ts;
      currentGroup = [assessment];
    } else if (ts - windowStart <= windowDays * 86400000) {
      currentGroup.push(assessment);
    } else {
      groups.push(currentGroup);
      currentGroup = [assessment];
      windowStart = ts;
    }
  }
  if (currentGroup.length) groups.push(currentGroup);

  return groups;
}
