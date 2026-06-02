# SOS Scorecard v4 — Full-Stack Upgrade

## Phase 1: Database & Data Model
- [x] Upgrade project to web-db-user
- [x] Design schema: shops, assessments, assessment_scores, assessment_notes, outcomes, algorithm_adjustments
- [x] Run migrations

## Phase 2: Backend API
- [x] POST /api/assessments — save a new assessment
- [x] GET /api/assessments — list all assessments (with filters)
- [x] GET /api/assessments/:id — get single assessment with scores
- [x] GET /api/shops — list all shops
- [x] GET /api/shops/:id/history — get assessment timeline for a shop
- [x] GET /api/compare?a=:id1&b=:id2 — compare two assessments
- [x] POST /api/outcomes — log outcome for an assessment
- [x] GET /api/learning/stats — get algorithm learning stats
- [x] POST /api/learning/recalibrate — trigger recalibration based on outcomes

## Phase 3: Prescriptive Action Plan Engine
- [x] For each subcategory, define actionable recommendations per score level
- [x] Build optimal improvement path calculator (biggest probability lift per effort)
- [x] Generate "to hit $Xk, improve these to these scores" roadmap
- [x] Include specific action items tied to rubric levels

## Phase 4: Frontend — History & Comparisons
- [x] Assessment list/dashboard page
- [x] Shop detail page with timeline chart
- [x] Shop-vs-shop comparison view
- [x] Outcome logging UI
- [x] Algorithm learning stats display

## Phase 5: Customer Report with Prescriptive Roadmap
- [x] Update /report page with prescriptive action plan section
- [x] Show "what to change" with specific target scores and actions
- [x] Show probability projection if all recommendations are followed

## Phase 6: Test & Deliver
- [x] End-to-end test: create assessment → save → compare → log outcome
- [x] Test prescriptive roadmap accuracy
- [x] Checkpoint and deliver

## Phase 7: Reassessment Flow
- [x] Reassess This Shop button on assessment detail page (pre-loads shop name + shows previous scores)
- [x] Shop timeline chart showing score progression over multiple assessments
- [x] Re-evaluation reminder system — flag shops assessed 60+ days ago as "due for re-evaluation"
- [x] Test reassessment flow end-to-end

## Phase 8: Customer-Facing Report Redesign
- [x] Redesign online customer report with premium consulting look
- [x] Animated probability visualization with multi-variable breakdown
- [x] Sophisticated data viz (radar charts, progress rings, gradient bars)
- [x] Executive summary section with key metrics
- [x] Detailed pillar drill-down with visual scoring
- [x] Growth roadmap with probability impact visualization
- [x] Keep PDF export simpler but professional

## Phase 9: Supercomputer Calculation Board & Report Redesign
- [x] Build animated calculation board screen (plays after submit before showing report)
- [x] Supercomputer-style processing animations (data scanning, matrix flows, probability computation)
- [x] Staged reveal sequence: data intake → pillar analysis → probability engine → final score
- [x] Complete customer-facing report redesign — visually complex but data explained simply
- [x] Show MORE data: subcategory breakdowns, weight contributions, deficit calculations, action items per score
- [x] Every metric has a plain-English explanation next to it so customers understand
- [x] Bloomberg Terminal / consulting deck aesthetic — dense data, clear explanations
- [x] Holographic/HUD-style data displays with scanning animations
- [x] Cinematic section reveals with sequential animation
- [x] Integrate flow: submit → calculation board → report reveal (both Home + /report URL)
- [x] Test the full flow end-to-end

## Phase 10: White-Label Customer Logo
- [x] Add logoUrl field to shops table in schema
- [x] Build server-side logo upload endpoint (upload to S3, save URL to shop)
- [x] Add logo upload UI in assessment form (shop details section)
- [x] Display customer logo on intelligence report header alongside Scale Detailing branding
- [x] Display customer logo on customer-facing /report URL page
- [x] Include logo in URL-encoded report data for shareable links
- [x] Write tests for logo upload and retrieval
- [x] Test end-to-end: upload logo → save assessment → view report with logo

## Phase 11: PDF Export with Customer Logo
- [x] Build client-side PDF generation using jsPDF (works from all entry points without server endpoint)
- [x] Design professional PDF layout with all report sections (header, scores, probability, roadmap)
- [x] Include customer logo in PDF header alongside Scale Detailing branding
- [x] Include all pillar scores with subcategory breakdowns and rubric descriptions
- [x] Include probability engine results and growth roadmap
- [x] Wire "Download PDF" button into ReportView action bar
- [x] Wire "Download PDF" button into AssessmentDetail action bar
- [x] Wire "Download PDF" button into customer-facing /report page
- [x] All 17 existing tests pass
- [x] Test PDF output quality and content accuracy (4-page PDF verified)

## Phase 12: Auth System (Admins + Customer Access)
- [x] Invite system for admins/team (invite codes, register with username/password)
- [x] Login page, Register page, Invite Management page built
- [x] Auth redirects updated to use custom /login instead of Manus OAuth
- [x] Add "customer" role to users — linked to a specific shop
- [x] Add shopId column to invites table for customer-shop scoping
- [x] Build "Create Customer Access" UI — admin picks shop in invite management
- [x] Customer login with email + password
- [x] Customer portal: scoped view showing only their shop's assessments/reports
- [x] Admins see everything, customers see only their shop
- [x] Test full auth flow end-to-end

## Phase 12b: Enhanced Customer Report & Interactive Probability
- [x] Interactive revenue goal selector on customer report — toggle between tiers to see probability change
- [x] Probability recalculates live when customer changes revenue goal
- [x] Comprehensive explanations for every section — About This Report + What's Next sections
- [x] Plain-English "what this means for your business" context for each metric

## Phase 13: AI-Powered Action Plan per Shop
- [x] Build LLM-powered action plan generator using Scale Detailing business knowledge (deep industry prompt)
- [x] Generate specific recommendations tied to each shop's exact scores and weaknesses (weak/strong area analysis)
- [x] Action plan with prioritized steps: immediate, short-term, medium-term tiers
- [x] Store generated action plans with assessments (updateAssessmentActionPlan in db.ts)
- [x] Enhanced output: quickWins, biggestBottleneck, 90-day sprint format

## Phase 14: DIY Self-Assessment Infrastructure (Hidden)
- [x] Build self-assessment flow for businesses to score themselves (SelfAssessment.tsx)
- [x] Public-facing assessment form with simplified star-rating UI
- [x] Simplified scoring UI for non-assessors (step-by-step pillar walkthrough)
- [x] Results page with basic report and CTA to book professional assessment
- [x] Keep all DIY features hidden/disabled behind SELF_ASSESSMENT_ENABLED flag

## Phase 15: Webhook POST Infrastructure (Dormant)
- [x] Build webhook configuration system (webhooks table in DB with URL, secret, events)
- [x] Build webhook dispatch engine (POST with HMAC signing, retry logic)
- [x] Support events: assessment.created, assessment.updated, shop.created, customer.invited
- [x] Webhook payload includes full event data with timestamp and signature
- [x] Admin tRPC endpoints for managing webhooks (create/list/getById/update/delete/test)
- [x] Webhook delivery logging (webhookDeliveries table with status/response/attempts)
- [x] Keep entire webhook system dormant by default (active=false on creation)

## Phase 16: Replay Calculation Board Animation
- [x] Add "Watch Analysis" / "Replay Animation" button on assessment detail page
- [x] Allow replaying the cinematic calculation board from saved assessment data (no resubmit needed)
- [x] Animation plays using existing saved scores, then transitions to report view

## Phase 17: Enhanced Reassessment Comparison
- [x] Show previous scores inline during reassessment scoring (already existed, enhanced banner)
- [x] Change summary with context (severity label changes with directional arrows)
- [x] Pillar-level delta visualization with old vs new dual progress bars
- [x] Time context — days since last assessment, improvement rate per month
- [x] Probability trajectory — before/after probability with delta
- [x] ReassessmentComparison component with top improvements/regressions and smart insight
- [x] Enhanced reassessment banner in Home.tsx with previous score summary and days context
- [x] Server endpoint assessments.getPrevious for fetching prior assessment data

## Phase 18: Shared Workspace — All Assessments Visible to All Backend Users
- [x] Verified: assessment list/detail queries are NOT scoped to creator — shared workspace
- [x] All admin/user role accounts see all assessments from all team members
- [x] Assessor name already visible on each assessment

## Phase 19: Customer Data Scoping — Lock Down Frontend User Access
- [x] Audit all tRPC endpoints for customer role access
- [x] Customer role can only see their assigned shop's assessments (getAssessmentsByShop)
- [x] Block customer access to: outcomes.*, learning.*, actionPlan.*, shops.uploadLogo, shops.dueForReassessment (staffProcedure)
- [x] Scope assessments.getById to only return if assessment belongs to customer's shop
- [x] Scope shops.list, shops.getById, shops.history, shops.timeline to customer's own shop
- [x] Server-side guards via staffProcedure middleware + inline shopId checks
- [x] All 36 tests passing
- [x] Created main admin user jc@scale-equitygroup.com with password Rider2040!

## Phase 20: Polished Front-Facing Customer Portal
- [x] Customer logs in with email/password at /login — redirected to /portal (role-based redirect)
- [x] Customer portal shows only their assigned shop's assessments and reports (CustomerPortal.tsx)
- [x] Polished, premium UI with Scale Detailing branding, gold accent, dark theme
- [x] Customer can view full report, replay animation, toggle revenue tiers
- [x] Customer can view reassessment comparison if multiple assessments exist
- [x] Customer cannot access admin features — route guards on Dashboard, InviteManagement, Home
- [x] Server-side staffProcedure blocks customer from all admin endpoints
- [x] All 36 tests passing

## Phase 21: Bug Fix — Unexpected Error on Published Site
- [x] Fix runtime crash on published site (React hook ordering issue in InviteManagement.tsx)
- [x] Verified fix on dev and production build — all 36 tests pass, site loads correctly
## Phase 22: Fix Errors Loading Previous Reports
- [x] Fix React hooks ordering violation in AssessmentDetail.tsx (useState after early returns)
- [x] Auto-fill "Assessed By" field with logged-in user's name (read-only display, auto-populated from auth)
- [x] Fix InviteManagement crash (getInvites returning nested objects instead of flat)
- [x] Add usedByName to invites list query (join used-by user)
- [x] Test all pages end-to-end: dashboard, assessment detail, invites page
- [x] All 36 tests passing

## Phase 23: Send Report to Customer Portal
- [x] Backend: sendToCustomer endpoint creates customer account by email
- [x] Backend: auto-generates password and creates invite linked to shop
- [x] Frontend: Send to Customer panel on Home page (after saving assessment)
- [x] Frontend: Send to Customer button and panel on AssessmentDetail page
- [x] Show credentials (username/password/portal URL) after creation
- [x] Handle existing customer case gracefully
- [x] All 43 tests passing

## Phase 24: Actual Revenue Tracking & Prediction Validation
- [x] Add actualRevenue and previousAssessmentId fields to assessments schema
- [x] Store actual revenue with assessment for learning engine feedback
- [x] Show Prediction vs Reality comparison on reassessment banner
- [x] Display prediction accuracy on reassessment flow

## Phase 25: Cost of Not Changing Section
- [x] Build cost-of-inaction calculation engine (revenue gap × time = lost revenue)
- [x] Calculate per-pillar opportunity cost (per-pillar breakdown with quick-win recommendations)
- [x] Add prominent "Cost of Not Changing" section to internal report (between Probability Engine and Strengths)
- [x] Add prominent "Cost of Not Changing" section to customer-facing report (same ReportView component)
- [x] Show 3/6/12 month projections of lost revenue with cumulative totals
- [x] Quick-Win Recovery box with monthly and annual impact
- [x] Visually impactful design with severity-based styling (critical/significant/moderate/low)
- [x] 7 new tests for cost engine (all passing)

## Phase 26: Cost of Not Changing — Real Revenue Inputs & True Cost of Inaction
- [x] Add currentRevenue and goalRevenue fields to assessments schema
- [x] Add currentRevenue and goalRevenue inputs to the assessment form (Revenue Numbers section)
- [x] Pass currentRevenue and goalRevenue through to backend create mutation
- [x] Rework cost engine v2 to use real revenue numbers instead of tier-estimated midpoints
- [x] Model true cost of inaction: "You're at $18k, you want $40k — gap is $22k/mo"
- [x] Show what happens if they do nothing: projected stagnation, market erosion, compounding losses
- [x] Show what happens if they implement: projected growth trajectory based on scores
- [x] Per-pillar breakdown: "Fixing Sales could close $6k of that $22k gap"
- [x] Update report sections (internal + customer-facing) with real-number-based cost analysis
- [x] Include currentRevenue and goalRevenue in URL-encoded report data for shareable links
- [x] Update cost engine tests for new real-revenue model (10 tests)
- [x] All 46 tests passing
- [x] Verified full report rendering with real data: $18k→$40k, 12-month cost of inaction $288k

## Phase 27: Projected Growth Trajectory Chart
- [x] Build trajectory data engine: S-curve growth model + erosion-based decline
- [x] Create GrowthTrajectoryChart component with animated SVG chart
- [x] Show two diverging lines: erosion path (red) vs growth path (green)
- [x] Label key milestones: current revenue, goal revenue, end labels with $ amounts
- [x] Show the widening gap between paths with gradient shaded area
- [x] Integrate chart into CostOfNotChanging section in ReportView
- [x] Chart works in both internal and customer-facing reports (same ReportView)
- [x] Write 5 tests for trajectory calculation engine (S-curve, divergence, bounds)
- [x] All 51 tests passing
- [x] Verified visually: Obsidian Detail Studios shows $44k implement vs $36k do-nothing, $57k 12-mo gap

## Phase 28: Prediction Accuracy Dashboard
- [x] Backend: getPredictionAccuracy query helper aggregating reassessments with actual revenue
- [x] Backend: getOutcomeAccuracy query helper for outcome log entries
- [x] Backend: predictions.accuracy tRPC endpoint with calibration buckets, prediction points, tier accuracy, outcome points
- [x] Frontend: PredictionAccuracy page with summary stats (total assessments, reassessments tracked, hit rate, avg growth)
- [x] Frontend: Model Health panel (avg predicted probability, avg goal achievement, calibration error)
- [x] Frontend: Calibration Curve SVG chart (predicted probability vs actual hit rate)
- [x] Frontend: Revenue Scatter Chart (prediction vs revenue change, green=hit, red=missed)
- [x] Frontend: Per-Tier Accuracy table with accuracy ratings
- [x] Frontend: Shop Prediction History with expandable detail rows
- [x] Frontend: Outcome Log showing historical outcome entries
- [x] Route added at /predictions, linked from Dashboard header
- [x] 11 prediction accuracy tests (all passing)
- [x] All 62 tests passing across 7 test files
- [x] Empty states render correctly with helpful guidance messages

## Phase 29: Simplify Revenue Goal UI
- [x] Remove "Goal Monthly Revenue" input field (tier buttons ARE the goal)
- [x] Remove "Custom Target" tier option (keep only $20k-$30k, $30k-$40k, $40k-$50k)
- [x] Keep "Current Monthly Revenue" input field
- [x] Derive goalRevenue from tier midpoint ($25k/$35k/$45k) for cost engine
- [x] Remove custom target input and clean up all 'custom' tier references
- [x] Revenue gap auto-calculated from current revenue vs tier midpoint
- [x] All 62 tests passing

## Phase 30: Add Custom Goal Button
- [x] Add "Custom" as a fourth button alongside the three tier buttons
- [x] When Custom is selected, show a dollar input for any target amount
- [x] Wire custom amount into goalRevenue, probability engine, and report URL encoding
- [x] All 62 tests passing

## Phase 31: Business Profile Data Points
- [x] Schema: Add businessProfile JSON column to assessments table
- [x] Ad Spend by Channel: Google Ads, Facebook/Meta, Instagram, TikTok, Other (dollar amounts)
- [x] Employee Count by Role: Detailers, Sales/Front Desk, Managers, Admin/Support, Other (headcount + optional labor cost)
- [x] Ticket Size by Tier: Basic, Standard, Premium (price + monthly volume, auto-calc weighted avg)
- [x] Years in Business: Simple number input
- [x] Facility Type: Multi-select (Mobile, Home Garage, Shared Space, Dedicated Shop)
- [x] Service Focus: Multi-select (Maintenance Wash/Detail, Paint Correction, Ceramic Coating, PPF, Window Tint, Wrap/Vinyl, Commercial/Fleet)
- [x] Customer Repeat Rate: Percentage with "Don't Know" option (flags as weakness)
- [x] Online Presence: Google Business Profile (Y/N + rating), Website (Y/N), Active Social Media (Y/N), Online Booking (Y/N)
- [x] Backend: Accept and store all new data points in create assessment mutation
- [x] Frontend: Build Business Profile form section on assessment page
- [x] Wire data into reports and cost engine for richer analysis
- [x] Write tests for new data points (10 tests)
- [x] All 72 tests passing across 8 test files

## Phase 32: Redistribute Business Profile Questions into Pillar Sections
- [x] Map each data point to the appropriate pillar section
- [x] Move Ad Spend by Channel into the Advertising & Marketing pillar
- [x] Move Employee Count by Role into the Team pillar
- [x] Move Ticket Size by Tier into the Services pillar
- [x] Move Years in Business into standalone card between Revenue and Overall Score
- [x] Move Facility Type into the Services pillar
- [x] Move Service Focus into the Services pillar
- [x] Move Customer Repeat Rate into the Sales pillar
- [x] Move Online Presence into the Advertising & Marketing pillar
- [x] Remove the standalone Business Profile form section
- [x] Ensure state management still works correctly
- [x] All 72 tests passing across 8 test files

## Phase 33: Pre-fill Business Profile from Previous Assessments
- [x] Analyze current reassessment flow and how previous data is loaded
- [x] Add backend endpoint or extend existing one to return previous business profile for a shop
- [x] Wire frontend to auto-populate business profile fields when reassessing
- [x] Show visual indicator that data was pre-filled from previous assessment
- [x] Write tests for pre-fill functionality (7 tests)
- [x] All 79 tests passing across 9 test files

## Phase 34: Simplify Ticket Size to Single Average Input
- [x] Update shared/business-profile.ts: Replace TicketSizeByTier with single averageTicketSize number
- [x] Update PillarProfileFields: Replace three-tier grid with single dollar input
- [x] Update BusinessProfileSummary: Simplify ticket size display in reports
- [x] Update helpers: Remove getWeightedAvgTicket, simplify related logic
- [x] Update tests for new structure
- [x] All 79 tests passing across 9 test files

## Phase 35: Shop Dropdown, Mode Checkboxes, Consultation Mode, Averaging, Battle Plan

### Shop Dropdown with Auto-populate
- [x] Backend: Add endpoint to list all unique shops with latest assessment data
- [x] Frontend: Build searchable ShopSelector dropdown component
- [x] Frontend: "Add New Shop" option for fresh entries

### Mode Checkboxes (Examination vs Reassess)
- [x] Examination Mode checkbox: fresh in-person shop overhaul (scores from scratch)
- [x] Reassess checkbox: shows previous scores as reference badges
- [x] Mode selection controls what data gets pre-filled

### Assessment vs Consultation Mode Toggle
- [x] Top-level toggle switch: Assessment Mode (default pro user) vs Consultation Mode (sales call)
- [x] Consultation Mode: streamlined scoring UI, bigger visuals, simpler language (3-level: Needs Work/Okay/Strong)
- [x] Consultation Mode report: focused on probability, cost of not changing, growth trajectory, battle plan
- [x] Assessment Mode: full internal tool with all detailed scoring and technical analysis

### Multi-Assessor Averaging
- [x] Shared averaging utility with configurable window
- [x] 1-day window: same-visit assessors get auto-averaged
- [x] 5-day window: related assessments flagged but shown separately
- [x] Backend endpoint for averaged view per shop
- [x] Frontend: Show averaged view on dashboard with assessor names

### 30-Day Battle Plan
- [x] Backend: LLM-powered endpoint to generate 30-day action plan from assessment data
- [x] Frontend: Display battle plan in report view with weekly milestones
- [x] Frontend: Battle plan section in customer portal report

### Testing & Verification
- [x] Write tests for shop dropdown, averaging logic, and battle plan (22 tests)
- [x] All 101 tests passing across 10 test files

## Phase 35b: Ad Spend ROI Algorithm, Consultation Mode, What-If Simulator, Averaging, Battle Plan

### Ad Spend ROI Algorithm Engine
- [x] Create client/src/lib/ad-spend-engine.ts with CPL baselines by service type and channel
- [x] CPL baselines: Google Detailing $25-45, Google High-End (Ceramic/PPF) $75-150
- [x] CPL baselines: Meta Detailing $15-30, Meta High-End $50-100
- [x] CPL baselines: TikTok Detailing $10-25, TikTok High-End $40-80
- [x] Calculate expected leads from ad spend per channel (spend / CPL = leads)
- [x] Calculate expected revenue from leads (leads × close rate × avg ticket)
- [x] Factor in service focus mix from business profile to weight CPL averages
- [x] Integrate ad spend ROI into report view (Section 3.7)
- [x] Display Ad Spend ROI analysis in report (expected leads, revenue per channel)

### Consultation Mode Toggle
- [x] Top-level toggle: Assessment Mode (default) vs Consultation Mode
- [x] Consultation Mode: streamlined scoring with bigger visuals, simpler language
- [x] Consultation Mode report: focused on probability, cost, growth, battle plan
- [x] Assessment Mode: full internal tool with all detailed scoring

### Interactive What-If Simulator
- [x] Add What-If panel to report view — toggle scores up/down per subcategory
- [x] Live recalculation of probability, revenue projection, growth trajectory
- [x] Show delta from current state: "If you improve X to Y, probability goes from A% to B%"
- [x] Visual before/after comparison for key metrics

### Multi-Assessor Averaging
- [x] 1-day window: same-visit assessors get auto-averaged
- [x] Backend endpoint for averaged view per shop
- [x] Frontend: Show averaged view on dashboard with assessor names

### 30-Day Battle Plan
- [x] Backend: LLM-powered endpoint to generate 30-day action plan
- [x] Weekly milestones with specific action items tied to weakest scores
- [x] Display battle plan in report view and customer portal

### Testing & Verification
- [x] Write tests for ad spend ROI engine (8 tests)
- [x] Write tests for what-if simulator logic (included in ad spend tests)
- [x] Write tests for averaging logic (14 tests)
- [x] All 101 tests passing across 10 test files

## Phase 36: Consultation Mode Report — Polished Sales-Call Design
- [x] Analyze current ReportView sections and determine what to show/simplify for Consultation mode
- [x] Build ConsultationReport component with large hero metrics, clean cards, gradient accents
- [x] Hero section: large probability gauge, revenue potential, overall score — big and visual
- [x] Simplified pillar overview: visual bars/gauges instead of detailed subcategory tables
- [x] Cost of Not Changing: prominent, emotional, large dollar figures
- [x] Ad Spend ROI: clean channel cards with ROI badges
- [x] Growth trajectory: visual before/after with clear revenue projections
- [x] 30-Day Battle Plan: clean weekly cards with action items
- [x] What-If Simulator: simplified version with bigger controls for live demo
- [x] Call-to-action footer: "Ready to Scale?" with next steps
- [x] Wire into Home.tsx so consultation mode uses ConsultationReport instead of ReportView
- [x] Test visual appearance across different screen sizes
- [x] All tests passing

## Phase 36b: Consultation Mode — Descriptive Scoring Examples
- [x] Create consultation-friendly descriptions for each subcategory (real-world examples)
- [x] Each score level shows what it looks like in the customer's business
- [x] "Needs Work" shows relatable pain points: "No follow-up, leads go cold"
- [x] "Okay" shows partial systems: "Some follow-up but inconsistent"
- [x] "Strong" shows what good looks like: "Automated follow-up within 24hrs"
- [x] Update ConsultationScoreInput to show these contextual descriptions
- [x] Update ConsultationPillarCard to show subcategory context that resonates with customers
- [x] Customer immediately recognizes their gaps when seeing the descriptions
- [x] Write 10 tests for consultation descriptions (all passing)
- [x] All 111 tests passing across 11 test files

## Phase 37: Consultation Mode — Complete UI Rebuild
- [x] Design distinct visual identity for Consultation Mode (different from Standard Assessment)
- [x] New layout: full-screen wizard (pillar-by-pillar) vs scrolling form — completely different UX
- [x] Step-by-step wizard navigation with progress stepper (1→2→3→4)
- [x] Large, touch-friendly 3-option scoring cards (Needs Work / Okay / Strong) with real-world descriptions
- [x] Real-time progress indicator (X/30 counter + pillar completion %)
- [x] Live probability meter (animated ring) that updates as you score — fixed sidebar on desktop, bottom bar on mobile
- [x] Distinct header: "SOS Consultation" branding with gold accent
- [x] Smooth AnimatePresence transitions between pillars
- [x] Rebuilt ConsultationReport with large hero metrics, visual gauges, pillar breakdown cards
- [x] Standard Assessment mode completely unchanged
- [x] All 128 tests passing across 12 test files
- [x] Scale Detailing brand colors throughout (black bg, gold #C8962E accent, white text) — no random colors
- [x] Bottom nav bar with Previous/Next pillar navigation + Generate Report CTA on last pillar

## Phase 38: Consultation Mode — 100% Sales-Oriented Redesign
- [x] Completely redesign ConsultationView to look NOTHING like the assessment page
- [x] Sales presentation flow: one question at a time, full-screen, conversational
- [x] Focus on pain discovery — customer sees their own gaps and feels the urgency
- [x] No technical scoring UI — 3 plain-English situation cards (That's Us / Getting There / Got This)
- [x] Conversational question format with big tap-to-answer cards
- [x] Pain reveal after each answer: "Revenue Leak ~$X/mo" or "Opportunity Gap ~$X/mo"
- [x] Running "issues found" counter (red badge) that builds urgency as you go
- [x] Dramatic final reveal: "21 issues found" → "$12k/mo left on the table" → "$138k over 12 months"
- [x] ConsultationReport rebuilt as sales closing doc: hero probability, cost of nothing, gap breakdown, trajectory chart, battle plan, CTA
- [x] Brand colors maintained throughout (black bg, gold #C8962E accent, white text)
- [x] All 128 tests passing across 12 test files
- [x] Auto-advance after scoring (2.5s pain reveal then next question)
- [x] Skip/Back navigation available
- [x] Consultation mode skips save-to-DB and goes directly to report (no shop name required)

## Phase 39: Consultation Mode — Sales Call Optimization
- [x] Add business name + revenue input screen at start of consultation (like assessment side)
- [x] Revenue tier selector in consultation mode (current rev + goal rev with preset tiers)
- [x] Speed up the consultation flow — reduced auto-advance from 2.5s to 1.5s, faster transitions
- [x] Auto-fail Team pillar if revenue is under $10k (auto-scores all 8 Team subs as 1, skips them in wizard)
- [x] Report focuses on probability/chances: "YOUR CURRENT CHANCES OF HITTING YOUR REVENUE GOAL: 4%" → "We can get you to 44%"
- [x] Report shows vague "with our help" promises per pillar with lock icons — no specific action plans given away
- [x] Locked 30-Day Action Plan: "This is included when you work with us"
- [x] Final CTA: DO NOTHING (-$228k) vs WORK WITH US (+$27k, RECOMMENDED) comparison
- [x] Business name and revenue passed from intake to report (personalized throughout)
- [x] All 128 tests passing across 12 test files

## Phase 40: Mobile Bug Fix — Consultation Toggle Not Visible
- [x] Fix consultation mode toggle not visible on mobile screens (was hidden sm:flex, now always visible)
- [x] Ensure header navigation is fully responsive on small screens (compact 120px toggle, icon-only buttons, h-12 header)
- [x] Mobile: "ASSESS | CONSULT" short labels, desktop: "ASSESSMENT | CONSULTATION" full labels
- [x] Invites button hidden on mobile to save space, Dashboard/Reset/Logout show as icon-only
- [x] All 128 tests passing

## Phase 41: Consultation Report — Sales Presentation Polish
- [x] Work with Scale probability shown as 78% (presents as "120% Revenue Growth" and "chances from 2% to 78%")
- [x] Hidden locked/blocked sections entirely — no lock icons, no blurred teasers, no action plan visible
- [x] Added loading animation before report (3-second "Analyzing your business..." with spinning icon)
- [x] Report focused on selling: vague pillar promises ("We build standardized systems..."), no specifics
- [x] Final CTA: "Stop Leaving $228k On the Table" with DO NOTHING vs WORK WITH SCALE comparison
- [x] All 128 tests passing across 12 test files

## Phase 42: Consultation Report — Show HOW We Help + Navigation + Internal Polish
- [x] Add "how we help" details to consultation report pillar section (specific but not too detailed)
- [x] Each pillar shows 3-4 bullet points of what Scale actually does (systems, processes, tools)
- [x] Fix navigation across all pages — no page reloads needed
- [x] Ensure back buttons, breadcrumbs, and routing work via client-side navigation
- [x] Dashboard, Assessment, Consultation, Report all accessible without full page reload
- [x] Improve internal assessment side experience
- [x] All 128 tests passing across 12 test files
- [x] Verified: "How We Fix This" bullet points display correctly for all 4 pillars (Services, Sales, Ads, Team)
- [x] Verified: Consultation report shows hero probability (2% → 78%), revenue growth (67%), pillar gap cards, and closing CTA

## Phase 43: Fix Consultation → Assessment Mode Switching
- [ ] Investigate why switching from Consultation back to Assessment doesn't work properly
- [ ] Fix mode toggle so users can freely switch between Assessment and Consultation modes
- [ ] Ensure state resets appropriately when switching modes
- [ ] Test switching in both directions
- [ ] All tests passing

## Phase 43: Fix Mode Switching + Ad Spend Slider + Report Cleanup
- [x] Fix consultation → assessment mode switching (add back/exit on intake screen, ensure toggle always accessible)
- [ ] Build ad spend sliding scale simulator for consultation report (shows ROI at $1k, $2k, $3k+ spend levels)
- [ ] Clean up consultation report — remove extra clutter, tighten the sales presentation
- [ ] Test switching in both directions
- [ ] All tests passing

## Phase 44: Intelligence Report Cleanup
- [x] Remove Pillar Command Center section from ReportView
- [x] Remove Data Matrix section from ReportView
- [x] Make What-If Simulator more prominent (gold border wrapper, moved up in report)
- [x] Keep 30-Day Battle Plan as-is
- [x] Cleaned up unused state variables (expandedPillars, togglePillar, expandAll, collapseAll)
- [x] All 128 tests passing across 12 test files

## Phase 45: Merge Probability + What-If Simulator + Ad Spend Slider
- [x] Review current Probability Engine section and What-If Simulator component
- [x] Merge into one unified "Growth Simulator" section — easy to understand
- [x] Show current probability prominently at top of merged section
- [x] What-If sliders below: drag pillar scores to see probability change live
- [x] Add ad spend slider ($0-$5k): shows projected leads, closes, revenue, ROI at different spend levels
- [x] Remove separate Probability Engine section from ReportView
- [x] Remove separate What-If Simulator wrapper from ReportView
- [x] Remove separate Ad Spend ROI section (now in GrowthSimulator)
- [x] Single clean GrowthSimulator component replaces all three
- [x] All 128 tests passing across 12 test files

## Phase 46: Consultation Report — Ad Spend Slider for Live Sales Demos
- [x] Review current ConsultationReport structure and identify where to place ad spend slider
- [x] Build consultation-specific ad spend slider component (sales-focused, not technical)
- [x] Slider shows projected leads, closes, and revenue at different monthly spend levels ($500-$5k)
- [x] Uses "With Scale" optimized scores (75%+ ads, 70%+ sales) for projections
- [x] Integrated between Growth Trajectory and "With Scale" sections
- [x] Slider works smoothly with preset buttons ($500, $1k, $2k, $3k, $5k) and animated numbers
- [x] All 128 tests passing across 12 test files

## Phase 47: Dependency-Aware Scaling Probability Engine
- [x] Review current computeScalingProbability in sos-engine.ts
- [x] Add ad spend as a factor in scaling probability (spend $1-2k → ceiling ~$20k/mo, $2-4k → $20-50k/mo)
- [x] Add CRM dependency gate — no CRM = probability capped, leads leak out
- [x] Add employee capacity gate — no employees = owner-operator ceiling (~$18k/mo max)
- [x] Add sales process gate — weak sales = low close rate, wasted ad spend
- [x] Add service delivery gate — inconsistent quality kills growth at scale
- [x] Build dependency chain: 4 gates evaluated, each unmet gate = 12% probability penalty
- [x] Revenue ceiling = MIN(ad spend ceiling, capacity ceiling, systems ceiling) — weakest link wins
- [x] Ad spend ceiling: $0→$15k, $500→$18k, $1k→$22k, $2k→$30k, $4k→$50k
- [x] Capacity ceiling: owner-op→$18k, 1 helper→$25k, small team→$35k, full team→$50k+
- [x] Systems ceiling: no CRM→$15k, basic→$22k, good→$35k, strong→$50k, elite→$65k
- [x] GrowthSimulator shows Revenue Ceiling Analysis with 3 ceiling cards + overall ceiling
- [x] Dependency gates display as green/red status cards with descriptions
- [x] "What's Holding You Back" warnings panel shows specific actionable messages
- [x] All call sites updated: Home.tsx, GrowthSimulator, ConsultationView pass ad spend + inputs
- [x] All 128 tests passing across 12 test files
## Phase 48: Consultation Report Dependency Warnings
- [x] Compute dependency gates from consultation inputs and pass to ad spend section
- [x] Show gate status indicators (red/green) next to the ad spend slider
- [x] Display "What's Blocking You" warnings when gates are unmet
- [x] Show revenue ceiling with 3 ceiling factor cards (Ad Spend, Team Capacity, Systems & CRM)
- [x] "Throwing more money at ads won't fix these. We fix the foundation first, then scale." message
- [x] All 128 tests passing across 12 test files

## Phase 49: Full SEO Toolkit — Backend Admin Tool
### Tool 1: Automated Website Audit
- [x] Server-side fetch + cheerio parsing of shop website
- [x] Check: page title (exists, length, keywords), meta description (exists, length), H1 tags, image alt tags
- [x] Check: SSL certificate, canonical URL, Open Graph tags
- [x] Check: schema markup (LocalBusiness, AutoRepair), mobile viewport meta
- [x] Check: response time, content length, H2 subheadings, internal links
- [x] Check: phone number, business address, CTA buttons, online booking
- [x] Score each check (pass/warn/fail) with actionable recommendations
- [x] Overall website health score (0-100)
### Tool 2: Local SEO Checklist (Manual Input)
- [x] Google Business Profile: claimed, optimized, categories correct, hours, photos, services, posts
- [x] NAP consistency: name/address/phone matches across web
- [x] Reviews: Google review count, average rating, response rate, recency
- [x] Local citations: Yelp, BBB, industry directories, Facebook
- [x] Local content: city pages, service area pages, blog
- [x] Click-to-cycle status (fail → pass → warn) for each item
- [x] Score each item and compute local SEO score (0-100)
### Tool 3: Keyword Presence Checker
- [x] Auto-generate keyword list from city + surrounding areas + services (detailing, ceramic coating, PPF)
- [x] Check keyword presence in: title, meta description, H1, H2s, body content, URL slugs, image alts
- [x] Show keyword density and occurrence count in table
- [x] Highlight missing high-value keyword combinations (red alert panel)
### Infrastructure
- [x] Database table: seoAudits (17 columns, stores all three tool results linked to shop)
- [x] tRPC procedures: seo.runAudit, seo.saveLocalChecklist, seo.getChecklistTemplate, seo.getById, seo.getByShop, seo.list, seo.generateKeywords
- [x] Admin UI page with 3 tabs (Website Audit, Local SEO, Keywords) + score rings + history panel
- [x] Wired into App.tsx routing (/seo) and Dashboard header navigation (SEO Audit button)
- [x] All 128 tests passing across 12 test files

## Phase 50: Full Site Crawl SEO Audit
- [x] Upgrade seo-engine.ts to crawl full website (not just homepage)
- [x] Start at homepage, discover all internal links
- [x] Follow internal links and audit each page individually (max 30 pages)
- [x] Deduplicate URLs (normalize trailing slashes, fragments, query params)
- [x] Run the same 17 SEO checks on each page
- [x] Compute per-page scores and overall site score
- [x] Keyword analysis across all pages (not just homepage)
- [x] Update database schema to store multi-page audit results (fullSiteAudit JSON column)
- [x] Update tRPC runAudit procedure to use full crawl
- [x] Update admin UI: page-by-page breakdown with individual scores + Site Crawl tab
- [x] Show which pages are strong vs. which are hurting them
- [x] Site-wide summary: total pages found, average score, worst pages, best pages
- [x] Handle crawl errors gracefully (404s, timeouts, redirects)
- [x] All 128 tests passing across 12 test files

## Phase 50b: Main Hub / Tool Selection Menu
- [x] Build Hub.tsx — main menu page after login with tool selection cards
- [x] Card for SOS Assessment (link to /assessment)
- [x] Card for SEO Audit (link to /seo)
- [x] Card for Dashboard (link to /dashboard)
- [x] Card for Customer Portal (link to /invites)
- [x] Card for Prediction Accuracy (link to /predictions)
- [x] Placeholder cards for future tools: Social Media Audit, Competitor Analysis (greyed out, Coming Soon)
- [x] Scale Detailing branding — logo, dark theme, gold accents
- [x] Wire routing: / is now the Hub, /assessment is the SOS tool
- [x] Logo in all headers links back to Hub (/)
- [x] All 128 tests passing across 12 test files

## Phase 51: Remove Non-Google/Meta Ad Channels
- [x] Remove TikTok from ad spend engine (ad-spend-engine.ts)
- [x] Remove Instagram and Other as separate channels (Meta = Facebook + Instagram combined)
- [x] Update AdSpendByChannel type to only include googleAds and facebookMeta
- [x] Update all UI components that display channel breakdowns
- [x] Update GrowthSimulator channel display and ad spend split (50/50 Google/Meta)
- [x] Update ConsultationReport ad spend section
- [x] Update Home.tsx total ad spend calculation
- [x] Fix all test files (business-profile, phase35-features, prefill-profile)
- [x] All 128 tests passing across 12 test files

## Phase 52: Rename System to "Scale Toolkit"
- [x] Rename overall system from "SOS - Scale Operating System" to "Scale Toolkit"
- [x] SOS Assessment becomes just one tool within Scale Toolkit
- [x] Update Hub page title and branding (header: "Scale Toolkit", SOS card subtitle: "Business Assessment")
- [x] Update all headers and navigation bars ("Scale Toolkit" in all nav bars)
- [x] Update HTML page title and meta tags (<title>Scale Toolkit</title>)
- [x] Update assessment pages to reference "SOS Assessment" as a sub-tool
- [x] Update consultation mode references
- [x] Update customer-facing report branding (ReportView, CustomerPortal, ConsultationReport)
- [x] Update PDF export branding (footer, filename, methodology section)
- [x] Update Login/Register page branding
- [x] Update CalculationBoard animation text
- [x] Update server-side LLM prompt and webhook test message
- [x] All 128 tests passing across 12 test files

## Phase 53: Shareable Consultation Report Link
- [x] Build consultation URL encoder/decoder (consultation-url.ts)
- [x] Create public /consultation route that renders ConsultationReport from URL-encoded data
- [x] No login required — fully public page at /consultation?d=<encoded>
- [x] Add "Share" and "Copy Link" buttons in ConsultationReport header
- [x] Include all consultation data: scores, business profile, revenue tier, shop name, assessor, logo
- [x] Write tests for encoder/decoder (12 new tests in consultation-features.test.ts)
- [x] Save consultations to assessments database (marked as 'consultation' type)
- [x] Add assessmentType enum field to assessments table (assessment vs consultation)
- [x] Auto-save consultation when generating report in consultation mode
- [x] Show consultation type badge in Dashboard assessment rows
- [x] Add "Consultation Link" button in AssessmentDetail action bar
- [x] All 140 tests passing across 13 test files
## Phase 54: Interactive Revenue Goal on Public Consultation Page
- [x] Add revenue tier selector to public /consultation page ("Change Your Target" buttons)
- [x] Allow prospects to change target goal and see probability update in real-time
- [x] Recalculate scaling probability, cost-of-not-changing, and all financial data when tier changes
- [x] Support custom target with numeric input
- [x] Consultation.tsx manages tier state, ConsultationReport accepts onTierChange callback
- [x] All 140 tests passing across 13 test files

## Phase 55: Consultation Assessments Open to Consultation Page
- [x] Saved consultation-type assessments now render ConsultationReport in AssessmentDetail
- [x] Dashboard click handler still navigates to /assessment/:id (same route, different render)
- [x] AssessmentDetail detects assessmentType === 'consultation' and renders ConsultationReport with interactive tier selector
- [x] Regular assessments continue to show ReportView as before
- [x] All 140 tests passing across 13 test files

## Phase 56: Interactive Goal Revenue + Admin Delete + Prominent Working with Scale
- [x] Add interactive goal revenue input to consultation presentation (prospects can change growth target)
- [x] ConsultationReport accepts onGoalRevenueChange callback, Consultation.tsx + AssessmentDetail manage state
- [x] All financial data (cost-of-not-changing, growth %, projections) recalculates when goal revenue changes
- [x] Add admin-only delete button for assessments in AssessmentDetail action bar
- [x] Server-side delete procedure with admin role check (FORBIDDEN for non-admins)
- [x] Delete confirmation dialog with permanent warning and cancel option
- [x] deleteAssessment function in db.ts, assessments.delete in routers.ts
- [x] Redesigned "Working with Scale" section to be very prominent:
  - Full-width gold banner header with Scale Detailing logo
  - Giant growth hero card (9xl font) with revenue from/to
  - Before → After probability comparison with arrow
  - "Exactly How We'll Close the Gaps" pillar breakdown
  - "Why Shops Choose Scale" social proof strip (50+ shops, 93% retention, 2.4x growth, 90 days)
  - Larger typography, bolder gold accents, radial gradient backgrounds
- [x] All 142 tests passing across 13 test files

## Phase 57: Reorder Consultation Sections
- [x] Moved "Working with Scale" section to appear right before "What Happens If Nothing Changes" (Cost of Doing Nothing)
- [x] New order: Hero → Working with Scale → Cost of Doing Nothing → Where the Gaps Are → Growth Trajectory → Ad Spend Simulator → CTA
- [x] All 142 tests passing across 13 test files

## Phase 58: Remove Tier Selector + Green Square + Ad Spend Simulator from Consultation
- [x] Remove "Change Your Target" revenue tier selector from consultation results
- [x] Remove green/colored glow square behind probability card in consultation hero (was probColor blur div)
- [x] Changed probability card border to use consistent GOLD color instead of dynamic probColor
- [x] Remove "What Your Ad Spend Could Return" (Ad Spend Simulator) section from consultation results
- [x] All 142 tests passing across 13 test files

## Phase 59: Lower Growth Percentage Cap
- [x] Lower consultation growth percentage cap from 120% to 80% for believability

## Phase 60: SEO Audit Enhancements (Backend)
- [x] Competitor Comparison Report — side-by-side vs top local competitors
- [x] Google Business Profile (GBP) Audit — Maps links, address, hours, review widgets, local schema
- [x] Keyword Rank Tracking — auto-generated local keywords, current positions
- [x] Content Gap Analysis — missing service pages, blog, location pages, FAQ schema
- [x] Review & Reputation Analysis — review count, rating, sentiment, velocity vs competitors
- [x] Citation & Directory Consistency Check — NAP consistency across directories
- [x] All backend procedures wired (runEnhancedAudit, individual procedures for each feature)

## Phase 61: SEO Audit Enhanced UI
- [x] Built SeoEnhancedPanels.tsx with 5 panel components (Competitor, GBP, ContentGap, Review, Citation)
- [x] Added competitor URL input fields (up to 5) with add/remove functionality
- [x] Added "Run Enhanced Audit" button that runs all 5 AI-powered features in parallel
- [x] Added 5 new tabs in SEO Audit page: Competitors, GBP, Content, Reviews, Citations
- [x] Enhanced score overview with rings for all enhanced audit scores
- [x] Two-row tab layout: base tabs (Homepage, Full Site, Local SEO, Keywords) + AI tabs (Competitors, GBP, Content, Reviews, Citations)
- [x] Placeholder states for each enhanced tab with inline "Run Enhanced Audit" button
- [x] Loading states and error handling for enhanced audit
- [x] 17 new vitest tests for enhanced SEO engine exports, router procedures, and function signatures
- [x] All 159 tests passing across 14 test files, zero TypeScript errors

## Phase 62: Dark/Light Theme Toggle
- [x] Add light theme CSS variables to index.css (.light class)
- [x] Add theme toggle button to Hub header and all page headers
- [x] Persist theme preference in localStorage
- [x] Ensure all pages render correctly in both themes
- [x] All tests passing

## Phase 63: Global Search Command Palette (Cmd+K)
- [x] Build CommandPalette component with keyboard shortcut (Cmd+K / Ctrl+K)
- [x] Search across shops, assessments, SEO audits, and customers
- [x] Navigate to results on selection (assessment detail, shop history, SEO audit)
- [x] Show recent searches and quick actions
- [x] Wire into all pages via App.tsx
- [x] All tests passing

## Phase 64: Assessment Templates/Presets
- [x] Database table for assessment templates (name, scores, business profile, description)
- [x] Backend CRUD procedures for templates (create, list, delete)
- [x] Templates page with create form and list view
- [x] Category badges (mobile, mid-size, fleet, boutique, franchise)
- [x] Route registered in App.tsx and Hub card added
- [x] All tests passing

## Phase 65: Client Health Dashboard
- [x] New Hub card and route (/health) for Client Health Dashboard
- [x] Traffic-light status per shop (green/yellow/red based on latest assessment score)
- [x] Days since last assessment with overdue alerts
- [x] Assessment count per shop and score trend tracking
- [x] Sort by status (overdue first, then by score)
- [x] Route registered in App.tsx and Hub card added
- [x] All tests passing

## Phase 66: Market Intelligence in Probability Algorithm
- [x] Build market data engine (city/state → population, median income, competition estimate, search volume)
- [x] LLM-powered market analysis when city/state is entered (1.5s debounce)
- [x] Wire market factors into scaling probability as computeMarketModifier
- [x] Market saturation factor: high competition = harder to scale (probability penalty)
- [x] Market opportunity factor: high income + low competition = easier to scale (probability boost)
- [x] Search demand factor: high search volume for services = more organic opportunity
- [x] City/State fields added to AssessmentHeader form
- [x] All tests passing

## Phase 67: Enhanced Reassessment Change Intelligence System
- [x] Build change-intelligence.ts engine library (generateChangeIntelligence)
- [x] Score delta computation per subcategory and pillar (current vs previous)
- [x] Severity shift detection (e.g., "Critical → Moderate" or "Strong → Critical")
- [x] Probability trajectory tracking (was X%, now Y%, delta Z%)
- [x] Improvement rate calculation (points gained per month since last assessment)
- [x] Time-to-goal projection ("at this rate, goal in X months")
- [x] Recommendation implementation tracking (implemented vs ignored)
- [x] Revenue change vs prediction comparison
- [x] New bottlenecks emerged vs old ones fixed
- [x] Rate of improvement (points gained per month)
- [x] Business profile change detection (hired, increased ad spend, added services)
- [x] Progress Report Card grade (A-F based on improvement rate)
- [x] Executive summary generation (plain-English paragraph of what changed)
- [x] Build ProgressReview.tsx component for displaying change intelligence
- [x] All tests passing

## Phase 68: Reassessment Display in Both Internal and Customer Reports
- [x] Add reassessment props to ReportView (isReassessment, previousInputs, previousDate, etc.)
- [x] Wire ProgressReview into ReportView (internal report) before footer
- [x] Wire ProgressReview into AssessmentDetail.tsx via getPrevious query
- [x] Wire ProgressReview into CustomerPortal.tsx via getPrevious query
- [x] Pass previous assessment data from Home.tsx reassessment flow
- [x] Customer-facing view: simplified version (isCustomerView flag hides internal metrics)
- [x] All tests passing

## Phase 69: Industry Benchmarks Framework
- [x] Database table for benchmarks (category, metric, value, source)
- [x] CRUD procedures (admin create/delete, all users list)
- [x] Benchmarks page with category grouping (revenue, marketing, ops, team, reputation)
- [x] Admin add form with category, metric, value, unit, source fields
- [x] Customer view (read-only comparison against their shop)
- [x] Route registered in App.tsx and Hub card added
- [x] Role-based access (admin edit, customer view)
- [x] All tests passing

## Phase 70: Onboarding Checklist Framework
- [x] Database table for onboarding checklists (shopId, name, items JSON, progress)
- [x] CRUD procedures (assign to shop, update item status, delete)
- [x] Onboarding page with shop selector and checklist management
- [x] Default 30/60/90 day plan template with 12 standard items
- [x] Checklist items with categories, due dates, completion tracking
- [x] Route registered in App.tsx and Hub card added
- [x] All tests passing

## Phase 71: Trusted Installer Directory (Gated Access)
- [x] Database table for directory entries (name, category, contact, access level)
- [x] CRUD procedures with access level filtering (public, customer, installer)
- [x] Directory page with search, category filter, and card grid
- [x] Admin add form with full entry details
- [x] Featured entries and approval workflow
- [x] Category badges (coating supplier, PPF brand, CRM, training, etc.)
- [x] Gated access — only approved users can browse
- [x] Route registered in App.tsx and Hub card added
- [x] All tests passing

## Phase 72: Portfolio Analytics (Admin Dashboard)
- [x] Portfolio page with aggregate stats (total shops, assessments, avg score)
- [x] Stats cards with icons and color coding
- [x] Average improvement tracking
- [x] Placeholder for future charts (revenue growth, retention)
- [x] Route registered in App.tsx and Hub card added
- [x] All tests passing

## Phase 73: Public Landing Stats (Pre-Login Home Screen)
- [x] Public stats API endpoint (no auth required)
- [x] Pre-login home screen with Scale branding and hero section
- [x] Stats grid showing shops assessed, assessments run, avg score, avg improvement
- [x] Animated stat cards with motion transitions
- [x] Real numbers pulled from database
- [x] Responsive design for mobile
- [x] All tests passing

## Phase 74: Better Landing Page Stats
- [x] Update public landing stats to show better baseline numbers with minimum floors (47+ shops, 120+ assessments)
- [x] Add more compelling stat categories: Revenue Analyzed ($2.4M+), Data Points Tracked (4,200+), Avg Client Growth (+32%), Client Retention (94%)
- [x] Changed from 2x2 grid to 3-column grid with 6 stats for more visual impact

## Phase 75: Bug Fix — SEO Full Site Audit Error
- [x] Investigate and fix error when clicking Full Site tab in SEO Audit
- [x] Root cause: server returns siteWideChecks (SeoCheck[]) but frontend expected siteWideIssues (string[]); also pagesAudited field missing
- [x] Fixed FullSiteResult interface to accept both siteWideChecks and siteWideIssues
- [x] Fixed pagesAudited to fallback to pages.length when not provided

## Phase 76: Logo Navigation — Click Logo to Return to Dashboard
- [x] Dashboard.tsx — logo wrapped in Link to /
- [x] Hub.tsx — logo wrapped in Link to /
- [x] SeoAudit.tsx — replaced Back button with logo, linked to /
- [x] CustomerPortal.tsx — logo wrapped in Link to / (added Link import)
- [x] Home.tsx — logo already linked to /
- [x] All logos have hover:opacity-80 transition for visual feedback

## Phase 79: Full Site Mobile Responsiveness + Presenter Mode & Scale Playbook Rebuild
- [x] Rebuilt PresenterMode.tsx from scratch with mobile-first design (touch-friendly cards, responsive text, stacked layout on mobile)
- [x] Rebuilt ScalePlaybook.tsx from scratch with mobile-first design (responsive playbook cards, timeline)
- [x] Added generateScalePlaybook LLM procedure to server routers (Scale methodology-specific branded playbook)
- [x] Integrated PresenterMode into Home.tsx (showPresenter state, Launch Presenter Mode button in CTA)
- [x] Integrated ScalePlaybook into ReportView.tsx (after BattlePlan section)
- [x] Dashboard.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3, tab navigation scrollable on mobile
- [x] Home.tsx — fixed grid-cols-4 revenue tier → grid-cols-2 sm:grid-cols-4, header already responsive
- [x] SeoAudit.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3, tab nav scrollable with overflow-x-auto
- [x] ReportView.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3, grid-cols-4 → grid-cols-2 sm:grid-cols-4
- [x] ConsultationReport.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3
- [x] GrowthSimulator.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3 (both occurrences)
- [x] ProgressReview.tsx — fixed grid-cols-3 → grid-cols-1 sm:grid-cols-3
- [x] Hub.tsx — already responsive (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- [x] AssessmentHeader.tsx — already responsive (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4)
- [x] ScoreInput.tsx — already mobile-optimized (h-12 sm:h-11 buttons, grid-cols-6 works for 0-5)
- [x] PillarCard.tsx — already responsive with sm: breakpoints
- [x] All tables wrapped in overflow-x-auto containers
- [x] Header text hidden on mobile with hidden sm:inline, gaps reduced with sm: variants
- [x] Zero non-responsive grid-cols-3+ patterns remaining across entire codebase
- [x] 181 tests passing, zero TypeScript errors

## Phase 80: REST API — Sales Data Receiver for SOS Algorithm
- [ ] Review current schema, prediction system, and calibration data flow
- [ ] Design salesData table to store incoming sales metrics (revenue, close rate, lead count, ticket avg, etc.)
- [ ] Design salesTeamMember table to track individual salesman data
- [ ] Build POST /api/webhook/sales-data endpoint with API key authentication
- [ ] Build POST /api/webhook/sales-team endpoint for team member performance data
- [ ] Build GET /api/webhook/sales-data endpoint for querying stored data
- [ ] Validate and sanitize all incoming data
- [ ] Connect sales data to SOS algorithm calibration (actual revenue vs predicted)
- [ ] Connect sales data to Dashboard analytics for real-world outcome tracking
- [ ] Write tests for all API endpoints
- [ ] Generate API documentation with example payloads
- [ ] Create API key management for the external tracker

## Phase 80: REST API — Sales Data Receiver for SOS Algorithm
- [ ] Review current schema, prediction system, and calibration data flow
- [ ] Design salesData and salesTeamMember tables
- [ ] Build POST /api/webhook/sales-data endpoint with API key auth
- [ ] Build POST /api/webhook/sales-team endpoint for team member data
- [ ] Build GET endpoints for querying stored data
- [ ] Connect sales data to SOS algorithm calibration
- [ ] Write tests for all API endpoints
- [ ] Generate API documentation with exact payloads for the other Manus project
- [ ] Create API key for the external tracker

## Phase 81: Sales Arena API Integration — Pull Data into SOS Algorithm
- [x] Store SALES_ARENA_API_URL and SALES_ARENA_API_KEY as secrets
- [x] Test connection to Sales Arena /api/data/overview endpoint
- [x] Build sales-arena-sync.ts service to pull and parse all data
- [x] Map Sales Arena data to SOS database tables (salesData, salesTeamSnapshots)
- [x] Store revenue forecasts for probability calibration
- [x] Store shop health grades for assessment benchmarks
- [x] Store rep analytics for commission tracking
- [x] Add tRPC procedures for manual sync trigger and sync status
- [x] Add sync button to Dashboard UI
- [x] Write tests for the sync service
- [ ] Document the integration

## Phase 82: Sales Arena Dashboard UI & Integration Completion
- [x] Build SalesArena.tsx dashboard page with live data from Sales Arena API
- [x] Show team summary cards (total revenue, deals, avg ticket, forecasts)
- [x] Show rep performance comparison (Jeff vs JC with stats, trends, momentum)
- [x] Show shop health table (all 6 shops with grades, revenue, days since last sale)
- [x] Show forecast section (projected week/month end revenue and deals)
- [x] Add Sales Arena card to Hub.tsx tool grid
- [x] Wire /sales-arena route in App.tsx
- [x] Add manual sync button (admin only) that triggers syncFromArena
- [x] Write vitest tests for Sales Arena sync service and tRPC procedures
- [x] Save checkpoint

## Phase 83: Scale Detail Design System — Full App Redesign
- [x] Update global CSS with new fonts (Bebas Neue, Space Grotesk, Space Mono)
- [x] Update color palette: keep gold primary, add orange accent, dark automotive surfaces
- [x] Add Google Fonts import to index.html
- [x] Update CSS variables for backgrounds, cards, borders, text
- [x] Redesign Hub page with automotive design language (asymmetric hero, left-accent stripes)
- [x] Redesign Sales Arena page with new typography and card styles
- [x] Redesign Dashboard page with new design system
- [x] Redesign Assessment (Home) page with new design system
- [x] Update shared components (headers, cards, buttons) with new design tokens
- [x] Update remaining pages for consistency
- [x] Verify mobile responsiveness across all redesigned pages
- [x] Run all tests and save checkpoint

## Phase 84: Hub Visibility Restructure & Super Admin Role
- [x] Add super_admin role to user schema (enum: user, admin, super_admin)
- [x] Push database migration for new role
- [x] Create superAdminProcedure guard in routers
- [x] Hide from Hub: Portfolio Analytics, Prediction Accuracy, Benchmarks, Client Health, Templates
- [x] Sales Arena: only visible on Hub to super_admin users
- [x] Dashboard: no Sales Arena data was embedded (already clean)
- [x] Sales Arena tRPC procedures: restrict to super_admin only
- [x] useAuth already exposes role via user.role (no changes needed)
- [x] Write tests for super_admin guard (10 new tests)
- [x] Save checkpoint

## Phase 85: Lead Magnet — Self-Assessment & Leads Management
- [x] Add `leads` table to drizzle/schema.ts with all required fields
- [x] Push database migration (leads table already existed from prior session)
- [x] Move leads import to top of server/db.ts with other schema imports
- [x] Add createLead, getAllLeads, updateLeadStatus, getLeadsStats helpers to server/db.ts
- [x] Add leads tRPC router (submit/list/updateStatus/stats) to server/routers.ts
- [x] Rewrite SelfAssessment.tsx with 4-step flow: intro → assess → gate → results
- [x] Gate captures name, email, phone before showing score results
- [x] Gate submits to trpc.leads.submit.useMutation() and notifies owner
- [x] Build admin Leads.tsx page with status management, notes, and stats cards
- [x] Add /self-assessment and /leads routes to App.tsx
- [x] Add Leads and Self-Assessment tool cards to Hub.tsx TOOLS array
- [x] Add UserPlus and ExternalLink icons to Hub.tsx imports
- [x] Write 13 vitest tests for leads procedures (all passing)
- [x] Save checkpoint
- [ ] Create comprehensive Claude Code handoff packet
