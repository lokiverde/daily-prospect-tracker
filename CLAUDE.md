# CLAUDE.md - Daily Prospect Tracker (Open Source)

## Brain Logging

After completing any feature, bug fix, or significant change, automatically save a summary to Tony's brain using the `mcp__tony-brain__save_to_brain` tool with source "claude-code". Include what was changed, why, and which files were affected. Do not wait for the user to ask -- do this proactively at the end of each completed task.

---

## What This Project Is

**Daily Prospect Tracker** is a free, open source, mobile-first sales activity tracker for real estate agents and sales teams. It lives at `lokiverde/daily-prospect-tracker` on GitHub.

**Three purposes this project serves simultaneously:**

1. **Open source giveaway** -- Any broker-owner or team leader can clone it, deploy it to their own Supabase and Vercel accounts, and run it for free. The code is the door opener.

2. **Consulting lead generator** -- Tony Self (Harcourts Hunter Mason, South Bay LA) implements this for broker-owners and team leaders at $3,500-$7,500 per engagement. The software is free. Tony's 30 years of brokerage operations knowledge is what they're actually paying for.

3. **Live keynote demo** -- Used in Tony's "AI at Work" presentations to Vistage CEO groups and real estate conferences. The demo site runs at a public URL with pre-populated fake agents already competing. Audiences can pull it up on their phones during the presentation.

**DEADLINE: Tony is speaking in Canada in two weeks. The demo site must be live before that date.**

**What this is NOT:**
- Not a SaaS product (that is salesgamify.com -- completely separate project)
- Not a private brokerage tool (that is tracker.huntermason.com -- completely separate project)
- Not a product Tony hosts for clients -- clients run it in their own infrastructure

---

## The Consulting Model (Critical Context)

When a broker-owner or team leader wants this set up:

1. **Zoom call 1 (1 hour):** Tony helps them create their own Supabase account and Vercel account. Discovery conversation: how many agents, team structure, current tracking method.
2. **Tony works offline in Claude Code** against their Supabase credentials. Customizes activity types, point values, agent roster, brokerage name and colors.
3. **Zoom call 2 (1 hour):** Walkthrough, agent training, handoff.
4. **Optional:** Monthly support retainer.

**Infrastructure rule:** Everything lives in the CLIENT'S accounts. Tony never hosts client data. Tony gets added as a collaborator, does the work, then optionally stays on retainer.

**Why Tony can charge $3,500-$7,500 for free software:**
- Any engineer can rebuild the code. Nobody can replicate 30 years of knowing why agents stop logging after week two, why leaderboards create resentment in some offices and accountability in others, why point systems have to feel fair to stick.
- Tony's brokerage operator experience is the actual product. The code just proves it works.

---

## Demo Site -- Priority Build for Canada Keynote

**URL:** To be determined (Vercel preview URL acceptable for keynote, custom domain preferred)

**What it needs to do:**
- Load instantly on a phone pulled from a pocket in a conference room
- Show a live-looking leaderboard with fake agents already competing
- Let Tony (or an audience member) tap to log an activity and watch the leaderboard update in real time
- Have a "Get This For Your Team" CTA at the bottom linking to Tony's consulting contact

**How the demo works:**
- Completely separate Supabase project from any production environment
- Pre-populated with 6-8 fake agents with names and point totals already set
- Resets automatically every 24 hours via pg_cron job inside Supabase (not on Tony's computer -- runs inside the DB automatically)
- No login required to view -- public leaderboard visible immediately
- One-tap activity logging available without account (demo mode, data resets nightly anyway)

**Fake agent roster for demo (pre-populate these):**
- Beowulf (top of leaderboard, 94 points -- yes, the Great Dane)
- Sarah M. -- 87 points
- James K. -- 71 points
- Priya R. -- 68 points
- Marcus T. -- 52 points
- Lisa C. -- 41 points
- Derek W. -- 23 points
- New Agent -- 0 points (shows the before state)

**pg_cron reset logic:**
- Every day at 3am UTC: reset all activity counts to zero, restore baseline point totals to pre-set values, keep agents and names intact
- This keeps the demo looking active (not brand new, not stale) without manual intervention

---

## Deploy to Vercel Button

Every broker-owner who sees this at a conference should be able to hand their phone to their office manager and say "deploy this." The README must include a one-click Deploy to Vercel button.

**What happens when someone clicks Deploy to Vercel:**
1. Vercel forks the repo into their GitHub account
2. Vercel prompts for environment variables (Supabase URL + keys)
3. Vercel deploys automatically
4. App loads at their Vercel URL
5. A first-run /setup wizard walks them through creating the first admin account and seeding their agent roster

**The /setup wizard is Phase 4 work -- get the demo live first. For now, document the manual setup steps clearly in README.md.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel |
| Repo | GitHub (lokiverde/daily-prospect-tracker, public) |

---

## Critical Architecture Notes (Preserve These)

**Timezone handling:** All date boundaries computed server-side in the brokerage's IANA timezone (stored in `brokerages.settings.timezone`). Helper functions in `src/lib/calculations.ts` accept an optional timezone parameter.

**RLS policies:** Use SECURITY DEFINER helper functions (`get_user_role()`, `get_user_team_id()`, etc.) to prevent infinite recursion from cross-table policy references.

**Never use `search_path = ''`** on functions that call `auth.uid()`. Use `SET search_path = 'public', 'auth'` instead.

**Multi-tenant from day one:** The schema supports multiple brokerages. Each client deployment is their own Supabase project, so tenant isolation is handled at the infrastructure level -- but the schema should still be clean for single-tenant use.

---

## Point System

**Daily goal: 80 points = one full productive workday**

| Activity | Points | Notes |
|----------|--------|-------|
| Open Escrow | +50 | Top value activity |
| Take Listing | +25 | |
| Write Offer | +25 | |
| Client Appointment (in-person) | +20 | |
| Set Appointment (with date) | +15 | |
| Open House | +12 | |
| Show Home | +8 | |
| Networking Event | +8 | |
| Review Received | +15 | |
| Post Video | +10 | |
| CMA Sent | +10 | |
| Request Client Review | +8 | |
| Referral Given or Received | +15 | |
| Door Knock | +5 | |
| Phone Call | +4 | |
| Follow-Up Call to Active Lead | +4 | |
| SOI Call | +4 | |
| Email/DM | +2 | |
| Voicemail Left | +2 | |
| Text Message | +1 | Max 30/day (30-point cap) |
| Weekly Sales Meeting | +10 | |
| Daily Huddle | +5 | |
| Agent Training | +5 | |

**Anti-gaming:** Text messages capped at 30/day. Back-dating limited to 5 days.

**Leaderboard display:** Percentage of daily goal achieved, not raw points. Agent at 95% beats agent at 80% even if raw points differ. Keeps competition fair across different markets.

---

## Build Priority Order (Canada Deadline First)

### Priority 1 -- Demo Site (Do This First)
1. Verify current app builds and deploys cleanly to Vercel
2. Create separate Supabase project for demo
3. Seed fake agent roster with pre-set point totals
4. Set up pg_cron daily reset job
5. Enable public leaderboard view (no login required)
6. Enable one-tap demo activity logging (no login, resets nightly)
7. Add "Get This For Your Team" CTA with Tony's consulting contact link
8. Confirm it loads fast on mobile, looks great on a phone held in landscape

### Priority 2 -- README and Deploy Button
1. Write clean README.md explaining what this is, who it's for, and how to self-deploy
2. Add Deploy to Vercel button
3. Document environment variables clearly
4. Add manual setup steps for the first-run experience
5. Add screenshots of the leaderboard and activity logging screen

### Priority 3 -- First-Run Setup Wizard (/setup route)
1. Detect if no admin account exists
2. Walk new deployer through: create admin account, set brokerage name, seed default activities
3. Redirect to dashboard when complete
4. This is what makes cold deployment work for non-technical broker-owners

### Priority 4 -- Polish and Open Source Release
1. MIT license confirmed (already in repo)
2. Contributing guidelines
3. Issue templates for feature requests
4. GitHub Actions for CI (lint + build check on PR)

---

## File Structure

```
daily-prospect-tracker/
+-- app/
|   +-- layout.tsx
|   +-- page.tsx                    # Public landing / leaderboard (no login required for demo)
|   +-- setup/page.tsx              # First-run wizard (Phase 3)
|   +-- (auth)/
|   |   +-- login/page.tsx
|   |   +-- signup/page.tsx
|   +-- (dashboard)/
|       +-- layout.tsx
|       +-- page.tsx                # Dashboard
|       +-- log/page.tsx            # Activity logging
|       +-- team/page.tsx           # Team leaderboard
|       +-- history/page.tsx
|       +-- settings/page.tsx
|       +-- admin/page.tsx          # Brokerage admin (broker-owner only)
+-- components/
|   +-- leaderboard/
|   |   +-- public-leaderboard.tsx  # No-login leaderboard for demo
|   |   +-- leaderboard-row.tsx     # Shows % of goal
|   +-- activity/
|   |   +-- activity-grid.tsx
|   |   +-- activity-button.tsx
|   |   +-- point-animation.tsx
|   +-- demo/
|       +-- demo-banner.tsx         # "This is a demo. Get this for your team." banner
|       +-- cta-strip.tsx           # Consulting CTA
+-- lib/
|   +-- supabase/
|   |   +-- client.ts
|   |   +-- server.ts
|   |   +-- middleware.ts
|   +-- activities.ts               # Activity definitions and point values
|   +-- calculations.ts             # Goal math, timezone-aware date boundaries
|   +-- demo.ts                     # Demo mode detection and handling
+-- supabase/
|   +-- migrations/                 # Schema migrations
|   +-- seed-demo.sql               # Demo agent data seed script
|   +-- cron-reset.sql              # pg_cron daily reset job
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_DEMO_MODE=false         # Set to true on demo deployment
NEXT_PUBLIC_CONSULTING_CTA_URL=https://calendly.com/techtony/30min
```

---

## Commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm run lint   # ESLint
```

---

## Design Principles

- Mobile-first -- 90% of use is on phones
- 30-second input -- large tap targets, no typing required
- Minimum tap targets: 48x48px
- No modals on mobile -- use full-screen pages
- Animate point changes for satisfying feedback
- Leaderboard always shows percentage of goal, never raw points
- No em-dashes anywhere in user-facing text or code comments

---

## What Success Looks Like

**For the Canada keynote:**
- [ ] Demo site loads in under 2 seconds on a phone
- [ ] Leaderboard shows 8 fake agents with realistic point totals
- [ ] Tony can tap to log an activity on stage and leaderboard updates live
- [ ] "Get This For Your Team" CTA is visible and clickable
- [ ] pg_cron resets demo data nightly without any manual intervention
- [ ] Works on iOS Safari and Android Chrome

**For open source release:**
- [ ] README explains the product clearly to a non-technical broker-owner
- [ ] Deploy to Vercel button works and produces a running app
- [ ] Environment variable setup is documented with screenshots
- [ ] MIT license is in place
- [ ] First-run /setup wizard guides cold deployers to a working app

---

## Relationship to Other Projects

| Project | What It Is | Infrastructure |
|---------|-----------|----------------|
| daily-prospect-tracker (this) | Open source, free, consulting lead gen | Client's own Supabase + Vercel |
| tracker.huntermason.com | Private HM brokerage tool, never touched | Tony's Supabase + Vercel |
| salesgamify.com | Paid SaaS, Stripe billing, Beowulf mascot | Tony's separate Supabase + Vercel |

These three projects never share infrastructure, databases, or code directly. Reference patterns across them -- never copy files between them.

---

## Notes for Claude Code

- Canada keynote is the hard deadline -- demo site is Priority 1, everything else waits
- The consulting CTA on the demo site should link to Tony's calendar or contact page (ask Tony for the URL before building the CTA component)
- pg_cron runs inside Supabase -- it does not require Tony's computer to be on
- Demo mode should be detectable via environment variable so the same codebase serves both demo and client deployments
- The leaderboard percentage calculation is the signature mechanic -- make sure it is correct before the demo goes live
- Never use em-dashes anywhere
