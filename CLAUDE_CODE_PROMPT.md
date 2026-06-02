# SOS Scorecard — Rebuild Prompt for Claude Code

## Context
This is a full-stack SOS (Sales Operations Scorecard) app built with React, tRPC, Drizzle ORM, and SQLite/LibSQL. It has been heavily developed (17 phases) but most of it needs to be shelved so we can focus on the core product.

---

## What You Are Doing

You are NOT deleting anything. You are:
1. **Shelving** pages and routes that are not needed right now (move them to `_shelved/` folders — hidden but preserved)
2. **Cleaning up** the active app to only include what's needed
3. **Building out** a full authentication system with role-based access
4. **Building** a quiz/lead magnet funnel (separate from the full audit)
5. **Wiring** the members portal so shop owners only see their own data

---

## Step 1 — Shelve These Pages (Move, Don't Delete)

Create a folder: `client/src/pages/_shelved/`

Move the following page files INTO `_shelved/` (they still exist, just not imported or routed):
- `SalesArena.tsx`
- `Leads.tsx`
- `SeoAudit.tsx`
- `PredictionAccuracy.tsx`
- `ClientHealth.tsx`
- `Templates.tsx`
- `Benchmarks.tsx`
- `Directory.tsx`
- `Portfolio.tsx`
- `Onboarding.tsx`
- `Consultation.tsx`
- `InviteManagement.tsx`
- `SelfAssessment.tsx`

Also move the old `CustomerPortal.tsx` into `_shelved/CustomerPortal.old.tsx`.

For any components used ONLY by shelved pages, move them to `client/src/components/_shelved/`.

---

## Step 2 — Clean Up App.tsx Routes

After shelving, `App.tsx` should only have these active routes:

```
/                → Hub (landing / home)
/login           → Login
/register        → Register
/quiz            → Quiz (NEW — lead magnet funnel, see Step 5)
/assessment      → Home (full SOS assessment, admin/super_admin only)
/assessment/:id  → AssessmentDetail (admin/super_admin only)
/report          → Report (results page)
/dashboard       → Dashboard (admin/super_admin only)
/portal          → CustomerPortal (NEW — members portal, see Step 4)
/admin           → AdminPanel (NEW — super admin only, see Step 6)
/404             → NotFound
```

Remove all other routes. Wrap protected routes with an `<AuthGuard>` component (see Step 3).

---

## Step 3 — Auth Guard Component

Create `client/src/components/AuthGuard.tsx`:

```tsx
// Redirects to /login if not authenticated.
// Accepts a `roles` prop — if provided, redirects to /portal (or /404) if user's role isn't in the list.
// Usage:
//   <AuthGuard>  — just requires login
//   <AuthGuard roles={["admin", "super_admin"]}>  — requires specific role
```

Rules:
- If not logged in → redirect to `/login`
- If logged in but wrong role → redirect to `/portal` for shop members, `/404` for others
- `super_admin` can access everything
- `admin` can access: `/assessment`, `/assessment/:id`, `/dashboard`, `/report`
- `customer` (shop member) can only access: `/portal`, `/report` (their own reports only)
- Unauthenticated users can access: `/`, `/login`, `/register`, `/quiz`

Use the existing `useAuth` hook at `client/src/_core/hooks/useAuth.ts`.

---

## Step 4 — Members Portal (CustomerPortal.tsx — Rebuild)

Build a new `client/src/pages/CustomerPortal.tsx` (replace the old one that was shelved).

This is the page shop owners land on after logging in. It should show:

1. **Their shop's latest SOS score** — overall percentage, band label (e.g. "At Risk", "Building", "Scaling")
2. **Their score history** — if they've been assessed more than once, show a simple timeline/chart
3. **How they compare to industry average** — a simple benchmark comparison (use the `industryBenchmarks` table)
4. **Their report** — a button that links to `/report?id=LATEST_ASSESSMENT_ID`
   - If their results are locked (see Step 5), show a "Book a Call to Unlock Your Full Results" CTA instead
5. **No cross-shop data** — query must filter by `shopId` tied to the logged-in user's `user.shopId`

Data isolation rule: Every DB query on this page MUST include a `where shopId = currentUser.shopId` condition. Never return data from other shops to a `customer` role user.

---

## Step 5 — Quiz Funnel (New Page)

Create `client/src/pages/Quiz.tsx` — this is the lead magnet / ad funnel version.

### Flow:
1. **Questions 1–4** — quick scored questions (use a subset of the existing SOS pillars — pick the 4 most impactful: e.g. Sales Process, Online Presence, Retention, Operations)
2. **Gate screen** — after question 4, before showing results: collect Name, Email, Phone. They must submit to continue. This is the lead capture moment.
3. **Questions 5–8** — remaining questions
4. **Results screen** — show their score, a letter grade (A/B/C/D/F), and a headline like "Your shop is leaving an estimated $X/month on the table." Then show a prominent CTA: "Book a Free Strategy Call" (link to booking page — use a placeholder URL for now, make it easy to update later via a constant in `client/src/const.ts`)

### Lead capture webhook:
When the gate screen form is submitted, fire a webhook to GHL. Create a placeholder function in `client/src/lib/webhooks.ts`:
```ts
export async function sendLeadToGHL(data: { name: string; email: string; phone: string; partialScore: number }) {
  // TODO: Replace WEBHOOK_URL with actual GHL webhook endpoint
  const WEBHOOK_URL = import.meta.env.VITE_GHL_WEBHOOK_URL ?? "";
  if (!WEBHOOK_URL) return; // silently skip if not configured
  await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
```

### Account creation prompt:
After results are shown, below the CTA, add a secondary prompt:
"Want to track your progress over time? Create a free account to save your results."
Link to `/register?prefill=email` (pass their email as a query param to pre-fill the register form).

### Quiz scoring:
Use simplified scoring — each question scores 0–3 points. Total maps to:
- 90–100%: A — "Scaling Ready"
- 70–89%: B — "Building Momentum"  
- 50–69%: C — "Needs Focus"
- Below 50%: D/F — "At Risk"

Revenue estimate formula (placeholder, easy to adjust):
```ts
const revenueGap = Math.round(((1 - scorePercent) * 8000) / 100) * 100; // rough gap estimate
```
Make this formula easy to find and change — put it in `client/src/lib/quiz-engine.ts`.

---

## Step 6 — Admin Panel (New Page)

Create `client/src/pages/AdminPanel.tsx` — super_admin only.

This page should show:
1. **All shops** — list of every shop in the DB with their latest score and assessment date
2. **All users** — list of users with their role, linked shop, and last sign-in
3. **Grant super_admin** — a simple UI to change a user's role (dropdown: user / admin / super_admin / customer)
4. **Assign shop to user** — link a customer account to a shopId

Wire this to new tRPC endpoints (add to `server/routers.ts`):
- `admin.listAllShops` — returns all shops with latest assessment score
- `admin.listAllUsers` — returns all users (super_admin only)
- `admin.updateUserRole` — updates a user's role (super_admin only)
- `admin.assignShopToUser` — sets user.shopId (super_admin only)

All four endpoints must check that the calling user has `role === 'super_admin'` before executing. Throw a `FORBIDDEN` error otherwise.

---

## Step 7 — Results Locking (Comprehensive Version)

In the existing `Report.tsx` page, add a `locked` state:

- If the assessment has `assessmentType === "assessment"` (full audit) AND the shop's customer account has `resultsUnlocked === false` (add this boolean field to the `shops` table via a migration), show a locked overlay:
  - Blur the report content
  - Show: "Your full results are ready. Book a call with us to unlock them."
  - CTA button: "Book Your Unlock Call" → booking link (same constant as Quiz page)

- Admin/super_admin users always see the full report regardless of lock status.
- Quiz results (`/quiz`) are never locked — they always show immediately.

Add `resultsUnlocked` boolean (default `false`) to the `shops` table in `drizzle/schema.ts` and run a migration.
Add a toggle in AdminPanel to unlock results for a specific shop.

---

## Step 8 — Login Page Updates

The existing `Login.tsx` already exists. Update it to support three methods:

1. **Email + Password** — already partially built, keep it
2. **Magic Link** — add a "Send me a login link" tab/toggle. On submit, call a new tRPC endpoint `auth.sendMagicLink` that sends an email with a signed token link (use a simple JWT or random token stored in DB). For now, log the link to console if no email service is configured — make it easy to wire up later.
3. **Google OAuth** — add a "Continue with Google" button. Wire to the existing OpenID/OAuth flow if already present in `server/auth*.ts`. If not, add a placeholder button that shows a "Coming Soon" toast for now.

On the login page, add a note at the bottom:
"New here? Take the free SOS Quiz first →" — links to `/quiz`

---

## Step 9 — Register Page Updates

The existing `Register.tsx` already exists. Update it to:
1. Accept a `?prefill=email` query param and pre-fill the email field
2. On successful registration, default role is `customer`
3. Show a message: "Your account is being set up. An admin will link your results shortly." (until their shopId is assigned)
4. If they came from the quiz (detect via query param `?from=quiz`), show: "Your quiz results have been saved to your account."

---

## Do Not Touch
- `server/seo-engine.ts`, `server/seo-enhanced-engine.ts` — leave as-is
- `client/src/lib/sos-engine.ts` — leave as-is  
- `drizzle/schema.ts` existing tables — only ADD new fields, never remove
- `server/db.ts` existing functions — only ADD new ones
- Anything inside `node_modules/` or `dist/`

---

## Summary of New Files to Create
- `client/src/pages/_shelved/` (folder + moved files)
- `client/src/components/_shelved/` (folder + moved components)
- `client/src/components/AuthGuard.tsx`
- `client/src/pages/CustomerPortal.tsx` (rebuilt)
- `client/src/pages/Quiz.tsx` (new)
- `client/src/pages/AdminPanel.tsx` (new)
- `client/src/lib/quiz-engine.ts` (new)
- `client/src/lib/webhooks.ts` (new)

## Summary of Files to Modify
- `client/src/App.tsx` — clean routes, add AuthGuard
- `client/src/pages/Report.tsx` — add results locking
- `client/src/pages/Login.tsx` — add magic link + Google tabs
- `client/src/pages/Register.tsx` — add prefill + messaging
- `server/routers.ts` — add admin.* endpoints + auth.sendMagicLink
- `drizzle/schema.ts` — add `resultsUnlocked` to shops
- `client/src/const.ts` — add BOOKING_URL constant

---

Start with Step 1 (shelving) first. Confirm each step before moving to the next.
