# Current State Notes

## Dev server: running on port 3000
## Project version: 4e45ebaf

## Key Files to Edit:
- client/src/components/ReportView.tsx — add revenue toggle, enhanced explanations
- client/src/pages/Home.tsx — reassessment already has previous scores inline
- client/src/pages/AssessmentDetail.tsx — add replay animation button
- client/src/components/CalculationBoard.tsx — replay support
- server/routers.ts — webhook, customer auth, action plan endpoints
- server/db.ts — webhook tables, customer queries
- drizzle/schema.ts — webhook tables, customer role already exists

## Already Built:
- Phases 1-11 all complete (DB, API, scoring, reports, PDF, logos, calculation board)
- Phase 12 partial: invite system, login, register pages done
- Schema already has: customer role enum, shopId on users table
- AI action plan tRPC endpoint already exists in routers.ts (actionPlan.generate)
- ScoreInput already shows previousScore badge during reassessment
- PillarCard already passes previousScores to ScoreInput

## Still Need:
- Phase 12 remaining: customer access creation UI, customer portal, scoping
- Phase 12b: interactive revenue toggle on report, enhanced explanations
- Phase 13: AI action plan UI (backend exists, needs frontend)
- Phase 14: DIY self-assessment (hidden)
- Phase 15: Webhook infrastructure (dormant)
- Phase 16: Replay animation button
- Phase 17: Enhanced reassessment comparison
