# Git Push — Safe Deploy Prompt for SOS Scorecard

Use this prompt with Claude Code every time you want to commit and push changes.

---

## Step 1 — Confirm You're in the Right Place
Run `pwd` and confirm the working directory is inside `sos-scorecard`. If not, stop and navigate there first.

Run `git branch` and confirm which branch you're on:
- **`dev`** — default for all active work. Push here freely.
- **`main`** — live/production branch. Only push here when explicitly told "push to main / this is ready to go live." If the user hasn't said that, default to `dev`.

If a `dev` branch doesn't exist yet, create it: `git checkout -b dev`

---

## Step 2 — Security Check (Run Every Time, No Exceptions)

Check that the following are listed in `.gitignore`. If any are missing, ADD them to `.gitignore` before staging anything:

```
.env
.env.local
.env.production
local.db
local.db-shm
local.db-wal
*.db
node_modules/
dist/
```

This project contains:
- GHL webhook URLs
- Anthropic API keys
- Database credentials / LibSQL auth tokens
- Customer shop data (assessment results, contact info)

None of that should ever be committed. If `.env` or any `.db` file shows up in `git status` as untracked or modified, stop immediately and fix `.gitignore` before proceeding.

---

## Step 3 — Check for Schema Changes

Run: `git diff --name-only` and look for changes to `drizzle/schema.ts`.

If `drizzle/schema.ts` was changed:
1. Run `pnpm drizzle-kit generate` to generate the migration file
2. Confirm the migration file was created in the `drizzle/` folder
3. Stage the migration file along with the schema change
4. Never push schema changes without the accompanying migration — it will break the deployed app

---

## Step 4 — Build Check

Run: `pnpm build`

If the build fails, stop. Fix the errors before committing. Do not push broken code.

---

## Step 5 — Pull First

Run: `git pull origin <current-branch>`

Resolve any merge conflicts before staging. Do not push on top of stale remote code.

---

## Step 6 — Stage and Commit

Run `git status` and review what changed.

Run `git add .` to stage all changes (the `.gitignore` from Step 2 protects sensitive files).

Write the commit message using this format:
```
type: short description of what changed

Examples:
feat: add quiz funnel with lead capture gate
fix: correct score calculation in sos-engine
chore: shelve unused pages to _shelved folder
auth: add magic link login support
portal: lock results until call is booked
admin: add user role management panel
```

Run: `git commit -m "your message here"`

---

## Step 7 — Push

Run: `git push origin <current-branch>`

If the push is rejected, run `git pull --rebase origin <current-branch>` then push again.

---

## Step 8 — Deployment Awareness

If pushing to **`main`**:
- Warn the user: "This will trigger a live deploy. Confirm you want to push to production."
- Wait for confirmation before running `git push origin main`
- After push, confirm the deploy started (check the host dashboard if accessible)

If pushing to **`dev`**:
- Push freely, no extra confirmation needed

---

## Summary Checklist (Quick Reference)
- [ ] In the right directory (`sos-scorecard`)
- [ ] On the right branch (`dev` unless told otherwise)
- [ ] `.env` and `*.db` files are in `.gitignore`
- [ ] Schema change? → Migration generated
- [ ] Build passes (`pnpm build`)
- [ ] Pulled latest remote changes
- [ ] Commit message follows `type: description` format
- [ ] If `main` → confirmed with user before pushing
