# SOS Scorecard — Session Notes
**Date:** June 2, 2026

---

## What We Decided

### Product Vision
The SOS system has two modes:

**1. Quiz / Lead Magnet**
- Cold traffic from ads (shop owners, mobile detailers)
- Quick scored questions, emotionally-driven hook ("your shop is leaving $X on the table")
- Collect name/email/phone halfway through → webhook to GHL
- Show results + "Book a Call" CTA after completion
- Prompt to create account after results (pre-fill email)

**2. Full SOS Audit**
- Comprehensive in-person or online assessment
- Results are LOCKED until shop owner books and takes a call
- Admin/super_admin can always see full results
- This is the deep operational scoring tool

### Members Portal
- Shop owners log in to see their own shop data only
- See their score, history, industry benchmarks
- Interactive AI assistant (the box) lives here
- Future: paid tiers unlock additional tools (SEO tool, ads agents, etc.)

### User Roles
| Role | Access |
|------|--------|
| `super_admin` | Everything — all shops, all data, admin panel |
| `admin` | Run assessments, view dashboard, see reports |
| `customer` | Their shop only — portal, their reports |
| Unauthenticated | Home, login, register, quiz |

### Auth Methods
- Email + password
- Magic link (send login link via email)
- Google OAuth
- Account creation triggered after first assessment/quiz

### What Gets Shelved
Pages moved to `_shelved/` (not deleted, just hidden):
SalesArena, Leads, SeoAudit, PredictionAccuracy, ClientHealth, Templates, Benchmarks, Directory, Portfolio, Onboarding, Consultation, InviteManagement, SelfAssessment, old CustomerPortal

### Future Roadmap (not building now)
- SEO tool
- Google Ads AI agent
- Meta Ads AI agent
- Paid tier / payment gating
- These will live inside the same members portal

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `CLAUDE_CODE_PROMPT.md` | Main rebuild prompt — shelving, auth, quiz, portal, admin panel |
| `GIT_PUSH_PROMPT.md` | Safe git push workflow with security checks |
| `AI_ENGINE_PROMPT.md` | Predictive AI engine + interactive AI assistant build prompt |

---

## AI Engine Architecture Decided

**Layer 1 — Background Prediction Engine** (`server/prediction-engine.ts`)
- Fires automatically on every assessment save (fire and forget)
- Uses existing Anthropic API in `server/_core/llm.ts`
- Generates: revenue projection, risk score, improvement probability per pillar, top 3 actions
- Stores results in a new `predictions` JSON field on the assessments table

**Layer 2 — Data Collection & Learning Loop** (`server/learning-engine.ts`)
- Captures patterns from assessments + logged outcomes over time
- Writes findings to existing `algorithmAdjustments` table
- Feeds back into prediction engine prompts for smarter predictions
- Self-assessment/quiz data also feeds dataset (even anonymous users)
- Admin can manually trigger re-analysis from AdminPanel

**Layer 3 — Interactive AI Assistant** (`client/src/components/AIAssistant.tsx`)
- Chat widget / "the box" in the members portal
- Knows the shop's scores, predictions, bottlenecks, history
- Pre-loaded suggested questions
- Backed by `aiAssistant.chat` tRPC endpoint
- Conversation history persists in localStorage per shopId

---

## Key Technical Notes
- Stack: React + tRPC + Drizzle ORM + SQLite/LibSQL
- Anthropic API already wired at `server/_core/llm.ts`
- DB already has: `outcomes`, `algorithmAdjustments`, `assessments`, `shops`, `users`, `invites` tables
- New tables needed: `selfAssessments`
- New fields needed: `predictions` on assessments, `resultsUnlocked` on shops
- Always run `pnpm drizzle-kit generate` after schema changes before pushing
- Branch strategy: work on `dev`, only merge to `main` when ready to go live

---

## How to Use the Prompts
1. Open Claude Code inside the `sos-scorecard` folder
2. Paste `CLAUDE_CODE_PROMPT.md` first — do the rebuild/shelving work step by step
3. Paste `AI_ENGINE_PROMPT.md` after — build the AI layers once the core is clean
4. Use `GIT_PUSH_PROMPT.md` every time you're ready to commit and push
