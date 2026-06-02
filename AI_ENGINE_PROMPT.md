# SOS Predictive AI Engine — Claude Code Build Prompt

## Overview
This prompt builds three connected AI layers on top of the existing SOS Scorecard codebase:

1. **Background Prediction Engine** — runs silently when assessments are saved
2. **Data Collection Loop** — captures patterns over time to improve predictions
3. **Interactive AI Assistant** — a chat widget in the members portal

The Anthropic API is already wired in at `server/_core/llm.ts`. The `outcomes` and `algorithmAdjustments` tables already exist in `drizzle/schema.ts`. Build on top of what's there — do not duplicate.

---

## Layer 1 — Background Prediction Engine

### What it does
Every time a new assessment is saved (full SOS audit or self-assessment), it automatically:
- Generates a **revenue projection** ("at your current trajectory, you'll hit $X in 90 days")
- Calculates a **risk score** (likelihood of stalling or churning based on score patterns)
- Produces an **improvement probability** per pillar ("raising Sales Process from 2→4 projects a $X/month lift")
- Identifies the **top 3 leverage actions** with highest ROI for that specific shop

### Where to build it
Create `server/prediction-engine.ts`

```ts
// Core function signature:
export async function runPredictionEngine(assessmentId: number): Promise<void>
// Called after every assessment save — does NOT block the API response
// Stores results back into the assessment record (predictions JSON field)
```

### How to trigger it
In `server/routers.ts`, find the assessment save endpoint. After the assessment is successfully inserted, call:
```ts
// Fire and forget — don't await, don't block the response
runPredictionEngine(newAssessmentId).catch(err => console.error("[Prediction Engine]", err));
```

### What it calls
Use the existing `callLLM` function from `server/_core/llm.ts`.

Build the prompt dynamically from the assessment data:
- Shop name and profile
- All pillar scores and subcategory scores
- Revenue tier
- Previous assessment scores (if reassessment)
- Industry benchmarks from the `industryBenchmarks` table
- Any logged outcomes from the `outcomes` table for this shop

The LLM should return structured JSON with:
```json
{
  "revenueProjection": {
    "current": 12000,
    "projected90Days": 18500,
    "projectedIfAllFixed": 28000,
    "confidence": 0.72
  },
  "riskScore": {
    "level": "medium",
    "score": 0.41,
    "primaryRiskFactor": "No structured follow-up process is causing lead leakage"
  },
  "pillarImpact": [
    { "pillar": "Sales Process", "currentScore": 2, "targetScore": 4, "projectedLift": 3200, "effort": "medium" },
    { "pillar": "Online Presence", "currentScore": 1, "targetScore": 3, "projectedLift": 2100, "effort": "low" }
  ],
  "top3Actions": [
    { "action": "Build a structured follow-up sequence for unsold estimates", "pillar": "Sales Process", "projectedLift": 2800, "timeToResult": "30 days" },
    { "action": "Respond to all Google reviews within 24 hours", "pillar": "Online Presence", "projectedLift": 1200, "timeToResult": "14 days" },
    { "action": "Add a referral incentive to every completed job", "pillar": "Retention", "projectedLift": 1800, "timeToResult": "45 days" }
  ],
  "summary": "One paragraph plain-English summary of the shop's situation and biggest opportunity"
}
```

### Schema addition
Add a `predictions` JSON field to the `assessments` table in `drizzle/schema.ts`:
```ts
predictions: text("predictions", { mode: "json" }),
```
Run a migration after adding this field.

---

## Layer 2 — Data Collection & Learning Loop

### What it does
As more assessments come in and outcomes get logged, the system learns:
- Which pillar scores actually correlate with revenue growth in real shops
- Which recommendations led to real improvement
- Which shop profiles (size, location, revenue tier) behave similarly

This data powers increasingly accurate predictions over time.

### How to build it

**Step 1 — Outcome logging (already exists, wire it up)**
The `outcomes` table already exists. Make sure every time an outcome is logged (revenue change, score change, action completed), it gets linked to the original assessment via `assessmentId`.

**Step 2 — Pattern analysis function**
Create `server/learning-engine.ts`:

```ts
export async function analyzePatterns(): Promise<void>
// Runs on a schedule (or manually triggered from AdminPanel)
// Looks at assessments where outcomes have been logged
// Finds correlations: which score improvements led to which revenue changes
// Writes findings to the algorithmAdjustments table
// These adjustments are fed back into the prediction engine prompt as context
```

**Step 3 — Feedback into predictions**
In `server/prediction-engine.ts`, before calling the LLM, query the `algorithmAdjustments` table for the most recent adjustments. Pass them into the prompt as:
```
"Based on real outcomes from similar shops, we've observed the following patterns: [adjustments]"
```

**Step 4 — Admin trigger**
In `AdminPanel.tsx`, add a "Re-run Learning Analysis" button that calls a new tRPC endpoint:
```
admin.runLearningAnalysis — triggers analyzePatterns(), super_admin only
```

**Step 5 — Self-assessment data**
When a quiz/self-assessment is completed (even without a full audit), save a lightweight record to a new `selfAssessments` table:

```ts
// Add to drizzle/schema.ts:
export const selfAssessments = sqliteTable("self_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shopId: integer("shopId"),               // null if taken anonymously (quiz funnel)
  email: text("email"),                    // captured from quiz lead gate
  scores: text("scores", { mode: "json" }).notNull(),
  overallScore: real("overallScore").notNull(),
  source: text("source", { enum: ["quiz", "portal"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
```

This means even anonymous quiz-takers contribute to the dataset. Over time you'll see how self-reported scores compare to your audited scores — a valuable signal.

---

## Layer 3 — Interactive AI Assistant (The Box)

### What it does
A persistent chat widget in the members portal. The shop owner can ask it anything about their business, their scores, what to do next. It knows their full context — scores, predictions, action plan, history.

### Where it lives
In `client/src/pages/CustomerPortal.tsx`, add an `<AIAssistant />` component as a panel/box on the page. It should be visually distinct — think of it as their personal coach, always available.

### Create `client/src/components/AIAssistant.tsx`

```tsx
// Props:
// - shopId: number
// - assessmentId: number (latest assessment)
// - predictions: PredictionResult (from Layer 1)

// UI:
// - Chat interface with message history
// - Input box at the bottom: "Ask your AI coach anything..."
// - Pre-loaded suggested questions:
//   "What should I focus on first?"
//   "How do I improve my follow-up process?"
//   "What's my biggest revenue opportunity right now?"
//   "How am I doing compared to other shops?"
// - Shows a typing indicator while waiting for response
// - Messages persist in localStorage per shopId (so they don't disappear on refresh)
```

### Backend endpoint
Add to `server/routers.ts`:

```ts
aiAssistant.chat — authenticated, customer role and above
// Input: { message: string, assessmentId: number, conversationHistory: Message[] }
// Output: { reply: string }
```

The endpoint:
1. Loads the full assessment + predictions + shop profile from DB
2. Builds a system prompt that gives Claude the shop's full context:
```
You are an AI business coach for [Shop Name], a detailing shop.
Their current SOS score is [X]% — [Band].
Their top 3 bottlenecks are: [bottlenecks].
Their biggest revenue opportunity is: [top action].
Their predicted revenue in 90 days if they take action: $[X].
Industry average for shops their size: [benchmark].

You help them understand their results and take action. Be specific, direct, and encouraging.
Never give generic advice — always tie your answer back to their actual scores and situation.
Keep responses conversational and under 150 words unless they ask for detail.
```
3. Appends conversation history
4. Appends the user's new message
5. Calls Claude and streams the response back

### Streaming (optional but recommended)
If you want a smooth typing effect, set up SSE (Server-Sent Events) for the chat endpoint instead of a standard tRPC query. If that's too complex for now, a standard request/response works fine — just add a loading spinner.

---

## Admin View — AI Insights Panel

In `AdminPanel.tsx`, add an "AI Insights" section that shows:
- All shops flagged as **high risk** by the prediction engine (risk score > 0.6)
- All shops with **highest revenue opportunity** (biggest gap between current and projected)
- Recent pattern findings from the learning engine
- A table: Shop Name | Risk Level | Revenue Gap | Last Assessment | Last Outcome Logged

This gives you a bird's-eye view of your entire book of shops and where to focus your attention.

---

## Summary of New Files to Create
- `server/prediction-engine.ts`
- `server/learning-engine.ts`
- `client/src/components/AIAssistant.tsx`

## Summary of Files to Modify
- `server/routers.ts` — add `aiAssistant.chat`, `admin.runLearningAnalysis` endpoints
- `server/db.ts` — add queries for predictions, selfAssessments, algorithmAdjustments
- `drizzle/schema.ts` — add `predictions` field to assessments, add `selfAssessments` table
- `client/src/pages/CustomerPortal.tsx` — add `<AIAssistant />` component
- `client/src/pages/AdminPanel.tsx` — add AI Insights panel

## Build Order
1. Schema changes + migration (predictions field, selfAssessments table)
2. `server/prediction-engine.ts` — core prediction logic
3. Wire prediction engine trigger into assessment save route
4. `server/learning-engine.ts` — pattern analysis
5. `aiAssistant.chat` tRPC endpoint
6. `AIAssistant.tsx` component
7. Wire into CustomerPortal
8. Admin Insights panel
9. Admin "Run Learning Analysis" button

Build and test each step before moving to the next.
