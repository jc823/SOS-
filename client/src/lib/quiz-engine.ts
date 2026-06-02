// ─── Quiz Engine ─────────────────────────────────────────────────────────────
// Scoring for the lead magnet quiz (/quiz). Each question is scored 0–3.
// Separate from the full sos-engine — do not mix.

export interface QuizQuestion {
  id: string;
  pillar: string;
  question: string;
  options: { label: string; value: number }[];
}

export interface QuizResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  band: "Scaling Ready" | "Building Momentum" | "Needs Focus" | "At Risk";
  revenueGap: number;
  pillarScores: Record<string, { score: number; max: number; pct: number }>;
}

// ─── Questions ───────────────────────────────────────────────────────────────
// 8 questions total — gate after question 4.
// 4 pillars: Sales Process, Online Presence, Retention, Operations

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── PHASE 1 (shown before gate) ──
  {
    id: "sales-process",
    pillar: "Sales Process",
    question: "How do you handle new inquiries?",
    options: [
      { label: "No real process — I respond when I can", value: 0 },
      { label: "I respond quickly but no follow-up system", value: 1 },
      { label: "I have a basic script and usually follow up", value: 2 },
      { label: "Structured intake, CRM, consistent follow-up", value: 3 },
    ],
  },
  {
    id: "online-presence",
    pillar: "Online Presence",
    question: "How would you describe your Google Business Profile & reviews?",
    options: [
      { label: "Not set up or rarely updated", value: 0 },
      { label: "Set up but few reviews (<20)", value: 1 },
      { label: "Active with 20–50 reviews and good rating", value: 2 },
      { label: "50+ reviews, 4.5+ stars, weekly activity", value: 3 },
    ],
  },
  {
    id: "retention",
    pillar: "Retention",
    question: "How often do past customers come back?",
    options: [
      { label: "Rarely — most are one-time", value: 0 },
      { label: "Some return but I don't track it", value: 1 },
      { label: "I have a loyalty/rebooking system that works sometimes", value: 2 },
      { label: "Strong rebooking rate with active retention system", value: 3 },
    ],
  },
  {
    id: "operations",
    pillar: "Operations",
    question: "How efficiently does your shop run day-to-day?",
    options: [
      { label: "Chaotic — I'm putting out fires constantly", value: 0 },
      { label: "Somewhat organized but no written processes", value: 1 },
      { label: "Most things are documented and mostly consistent", value: 2 },
      { label: "SOPs in place, team runs well without me", value: 3 },
    ],
  },
  // ── PHASE 2 (shown after gate) ──
  {
    id: "pricing",
    pillar: "Sales Process",
    question: "How is your pricing structured?",
    options: [
      { label: "I price based on what feels right or what competitors charge", value: 0 },
      { label: "I have a rough menu but adjust often", value: 1 },
      { label: "Clear menu with tiered packages", value: 2 },
      { label: "Value-based pricing with upsell strategy built in", value: 3 },
    ],
  },
  {
    id: "marketing",
    pillar: "Online Presence",
    question: "How are you currently getting new customers?",
    options: [
      { label: "Word of mouth only", value: 0 },
      { label: "Occasional social posts", value: 1 },
      { label: "Consistent content + some paid ads", value: 2 },
      { label: "Multi-channel strategy with trackable ROI", value: 3 },
    ],
  },
  {
    id: "team",
    pillar: "Operations",
    question: "How trained and reliable is your team?",
    options: [
      { label: "It's just me or team is inconsistent", value: 0 },
      { label: "Team is there but output varies", value: 1 },
      { label: "Team is solid, occasional training gaps", value: 2 },
      { label: "Well-trained team with clear standards", value: 3 },
    ],
  },
  {
    id: "upsell",
    pillar: "Retention",
    question: "Do you offer service packages or memberships?",
    options: [
      { label: "No — just one-off jobs", value: 0 },
      { label: "I've tried but nothing stuck", value: 1 },
      { label: "Basic package options available", value: 2 },
      { label: "Active membership / package program with real uptake", value: 3 },
    ],
  },
];

export const GATE_AFTER_INDEX = 3; // Gate fires after question index 3 (4th question)

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Revenue gap estimate — how much monthly revenue the shop is losing.
 * Easy to adjust: change the multiplier (8000) or formula.
 */
export function computeRevenueGap(scorePercent: number): number {
  return Math.round(((1 - scorePercent) * 8000) / 100) * 100;
}

export function computeQuizResult(answers: Record<string, number>): QuizResult {
  const questions = QUIZ_QUESTIONS;
  const maxPerQ = 3;

  // Per-pillar breakdown
  const pillarMap: Record<string, { score: number; max: number }> = {};
  for (const q of questions) {
    if (!pillarMap[q.pillar]) pillarMap[q.pillar] = { score: 0, max: 0 };
    pillarMap[q.pillar].score += answers[q.id] ?? 0;
    pillarMap[q.pillar].max += maxPerQ;
  }

  const pillarScores: QuizResult["pillarScores"] = {};
  for (const [pillar, { score, max }] of Object.entries(pillarMap)) {
    pillarScores[pillar] = { score, max, pct: Math.round((score / max) * 100) };
  }

  const totalScore = Object.values(answers).reduce((s, v) => s + v, 0);
  const maxScore = questions.length * maxPerQ;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let grade: QuizResult["grade"];
  let band: QuizResult["band"];
  if (percentage >= 90) { grade = "A"; band = "Scaling Ready"; }
  else if (percentage >= 70) { grade = "B"; band = "Building Momentum"; }
  else if (percentage >= 50) { grade = "C"; band = "Needs Focus"; }
  else if (percentage >= 30) { grade = "D"; band = "At Risk"; }
  else { grade = "F"; band = "At Risk"; }

  return {
    totalScore,
    maxScore,
    percentage,
    grade,
    band,
    revenueGap: computeRevenueGap(percentage / 100),
    pillarScores,
  };
}
