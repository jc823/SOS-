import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export async function runPredictionEngine(assessmentId: number): Promise<void> {
  try {
    // 1. Fetch assessment + shop info
    const result = await db.getAssessmentById(assessmentId);
    if (!result) return;
    const { assessment, shopName } = result;

    // 2. Fetch shop profile
    const shop = await db.getShopById(assessment.shopId);

    // 3. Fetch assessment history for this shop (last 3)
    const historyRows = await db.getAssessmentsByShop(assessment.shopId);
    const previousAssessments = historyRows
      .filter((r) => r.assessment.id !== assessmentId)
      .slice(0, 3);

    // 4. Fetch outcomes for this assessment
    const outcomes = await db.getOutcomesByAssessment(assessmentId);

    // 5. Fetch latest algorithm adjustments (top 5)
    const adjustments = await db.getLatestAlgorithmAdjustments(5);

    // 6. Fetch industry benchmarks (first 8 as context)
    const allBenchmarks = await db.getIndustryBenchmarks();
    const benchmarks = allBenchmarks.slice(0, 8);

    // 7. Build system prompt
    const pillarResultsStr = JSON.stringify(assessment.pillarResults ?? {});
    const bottlenecksStr = JSON.stringify(assessment.bottlenecks ?? []);

    const previousSummary = previousAssessments.length > 0
      ? previousAssessments.map((r) => {
          const a = r.assessment;
          return `Date: ${a.assessmentDate}, Score: ${a.overallPercentage}%, Band: ${a.overallBand}, Revenue: $${a.currentRevenue ?? "unknown"}`;
        }).join("\n")
      : "None";

    const outcomesSummary = outcomes.length > 0
      ? outcomes.map((o) =>
          `Hit target: ${o.hitTarget}, Revenue at outcome: $${o.actualRevenue ?? "unknown"}, Months elapsed: ${o.monthsElapsed ?? "unknown"}`
        ).join("\n")
      : "None logged";

    const adjustmentsSummary = adjustments.length > 0
      ? adjustments.map((a) => a.description ?? a.adjustmentType).join("\n")
      : "None yet";

    const benchmarksSummary = benchmarks.length > 0
      ? benchmarks.map((b) => `${b.category} - ${b.metric}: ${b.value} ${b.unit ?? ""}`).join("\n")
      : "None available";

    const systemPrompt = `You are a revenue prediction AI for auto detailing shops. Analyze the assessment data and return ONLY valid JSON with no markdown.

Shop: ${shopName ?? "Unknown"}
Revenue Tier: ${assessment.revenueTier}
Current Monthly Revenue: $${assessment.currentRevenue ?? "unknown"}
Goal Revenue: $${assessment.goalRevenue ?? "unknown"}
Overall SOS Score: ${assessment.overallPercentage}% (${assessment.overallBand})
Scaling Probability: ${assessment.scalingProbability}%
Assessment Date: ${assessment.assessmentDate}

PILLAR SCORES:
${pillarResultsStr}

TOP BOTTLENECKS:
${bottlenecksStr}

PREVIOUS ASSESSMENTS (last 3):
${previousSummary}

OUTCOMES LOGGED:
${outcomesSummary}

INDUSTRY ADJUSTMENTS FROM REAL DATA:
${adjustmentsSummary}

INDUSTRY BENCHMARKS:
${benchmarksSummary}

Return exactly this JSON structure:
{
  "revenueProjection": {
    "current": <number>,
    "projected90Days": <number>,
    "projectedIfAllFixed": <number>,
    "confidence": <0-1>
  },
  "riskScore": {
    "level": "low|medium|high",
    "score": <0-1>,
    "primaryRiskFactor": "<one sentence>"
  },
  "pillarImpact": [
    { "pillar": "<name>", "currentScore": <0-100>, "targetScore": <0-100>, "projectedLift": <$/month>, "effort": "low|medium|high" }
  ],
  "top3Actions": [
    { "action": "<specific action>", "pillar": "<name>", "projectedLift": <$/month>, "timeToResult": "<X days>" }
  ],
  "summary": "<one paragraph plain-English summary>"
}`;

    // 8. Call LLM
    const llmResponse = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate prediction analysis for this assessment." },
      ],
      max_tokens: 1500,
    });

    const content = llmResponse.choices[0]?.message?.content ?? "";

    // 9. Parse JSON from response (handle extra text before/after)
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[Prediction Engine] Could not extract JSON from LLM response for assessment", assessmentId);
      return;
    }
    const parsed = JSON.parse(match[0]);

    // 10. Store predictions
    await db.updateAssessmentPredictions(assessmentId, JSON.stringify(parsed));
    console.log("[Prediction Engine] Predictions saved for assessment", assessmentId);
  } catch (err) {
    console.error("[Prediction Engine] Error for assessment", assessmentId, err);
  }
}
