import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export async function analyzePatterns(): Promise<void> {
  try {
    // 1. Fetch all assessments with outcomes
    const rows = await db.getAssessmentsWithOutcomes();

    // 2. Need at least 3 outcomes to analyze
    if (rows.length < 3) {
      console.log("[Learning] Not enough data yet");
      return;
    }

    // 3. Build data summary for LLM
    const dataSummary = rows.map((r: any) =>
      `Shop: ${r.shopName}, Date: ${r.assessmentDate}, Score: ${r.overallPercentage}%, ` +
      `Scaling: ${r.scalingProbability}%, Tier: ${r.revenueTier}, ` +
      `CurrentRevenue: $${r.currentRevenue ?? "unknown"}, GoalRevenue: $${r.goalRevenue ?? "unknown"}, ` +
      `HitTarget: ${r.hitTarget}, OutcomeRevenue: $${r.outcomeRevenue ?? "unknown"}, ` +
      `MonthsElapsed: ${r.monthsElapsed ?? "unknown"}`
    ).join("\n");

    const systemPrompt = `You are an AI analyst for an auto detailing business coaching platform.
You have access to historical assessment outcomes. Identify statistically meaningful patterns
that can improve revenue predictions. Return ONLY valid JSON with no markdown.

Return exactly this JSON structure:
{
  "findings": [
    {
      "pattern": "<short pattern name>",
      "pillar": "<pillar id or null>",
      "confidence": <0-1>,
      "sampleSize": <number>,
      "description": "<one to two sentence description of the pattern and its implication>"
    }
  ]
}`;

    const userMessage = `Here is the assessment outcome data:\n\n${dataSummary}\n\nIdentify patterns in the data.`;

    // 4. Call LLM
    const llmResponse = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 1000,
    });

    const content = llmResponse.choices[0]?.message?.content ?? "";

    // 5. Parse JSON response
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[Learning] Could not extract JSON from LLM response");
      return;
    }
    const parsed = JSON.parse(match[0]);

    const findings: Array<{
      pattern: string;
      pillar?: string | null;
      confidence?: number;
      sampleSize?: number;
      description: string;
    }> = parsed.findings ?? [];

    // 6. Save each finding as an algorithm adjustment
    for (const finding of findings) {
      await db.createAlgorithmAdjustment({
        adjustmentType: "pattern",
        pillarId: finding.pillar ?? null,
        description: finding.description,
        confidence: finding.confidence ?? null,
        sampleSize: finding.sampleSize ?? null,
        payload: JSON.stringify(finding),
      });
    }

    // 7. Log completion
    console.log(`[Learning] Analysis complete — ${findings.length} findings saved`);
  } catch (err) {
    console.error("[Learning] Error during pattern analysis:", err);
  }
}
