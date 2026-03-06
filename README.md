# Daily Prospect Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flokiverde%2Fdaily-prospect-tracker&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20credentials%20from%20your%20project%20dashboard&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi&project-name=daily-prospect-tracker)

A **mobile-first daily activity tracker** for real estate agents. Point-based gamification, funnel tracking, team leaderboards, and admin controls -- all designed so logging an activity takes less than 30 seconds.

Built with **Next.js 14+**, **Supabase**, and **Tailwind CSS**.

---

## Features

- **Tap-to-log activities** -- 19 pre-configured real estate activities with point values
- **Daily point goals** -- 80 points = a full productive day
- **Streak tracking** -- Hit your goal daily to build a streak
- **Team leaderboards** -- Real-time rankings by week, month, or year
- **Funnel tracking** -- Contacts to appointments to contracts to closings
- **Goal setup wizard** -- Connect annual income goals to daily point targets
- **Admin panel** -- Manage agents, teams, point values, and brokerage settings
- **Configurable timezone** -- IANA timezone picker in admin settings
- **Activity history** -- Full audit trail with delete capability
- **Mobile-first** -- Designed for phones with 48px tap targets and bottom navigation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend/Backend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (email/password, magic link) |
| Hosting | Vercel |

---

## Quick Start

### Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- Node.js 18+ (for local development)

### Step 1: Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Wait for the project to finish provisioning (~2 minutes)
3. Go to **Settings > API** and note these three values:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) -- keep this secret

### Step 2: Run Database Migrations

Run these SQL files **in order** in the Supabase SQL Editor (**SQL Editor** in the left sidebar):

1. `supabase/migrations/00001_initial_schema.sql` -- Tables, triggers, seed data (19 activities + quotes)
2. `supabase/migrations/00002_phase1c.sql` -- Leaderboard and admin RPC functions
3. `supabase/migrations/00003_timezone_aware_leaderboard.sql` -- Timezone-aware date boundaries
4. `supabase/migrations/00004_security_fixes.sql` -- Security hardening
5. `supabase/migrations/00005_rls_performance.sql` -- RLS policy consolidation

Copy the entire contents of each file, paste into the SQL Editor, and click **Run**. Wait for each to complete before running the next.

### Step 3: Deploy to Vercel

Click the button below. Vercel will prompt you for the three Supabase values from Step 1.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flokiverde%2Fdaily-prospect-tracker&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20credentials%20from%20your%20project%20dashboard&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi&project-name=daily-prospect-tracker)

### Step 4: First-Run Setup

1. Open your deployed URL
2. Click **Sign Up** and create your admin account
3. You will be redirected to the **Setup** page
4. Enter your brokerage name and select your timezone
5. Click **Create Brokerage** -- you are now the admin
6. Complete the **Goal Setup Wizard** to set your daily point target
7. Start logging activities!

### Step 5: Invite Your Team

1. Go to **Admin > Invite**
2. Generate an invite link (optionally assign to a team)
3. Share the link with your agents -- they will be automatically added to your brokerage

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/lokiverde/daily-prospect-tracker.git
cd daily-prospect-tracker

# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your values

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Customization

### Activities and Point Values

Go to **Admin > Settings** to:
- Change point values for any activity
- Hide activities that do not apply to your brokerage
- Add custom activities with your own point values

### Daily Goal

The default daily goal is **80 points** (equivalent to a full productive 8-hour day). Change the brokerage default in **Admin > Settings**, or let each agent set their own in **Settings > Goals**.

### Funnel Conversion Rates

Default rates (Contacts 30% to Appointments 50% to Contracts 80% to Closings) can be adjusted in **Admin > Settings > Funnel Conversion Rates**. Agents will see updated funnel targets after re-running the Goal Setup wizard.

### Timezone

Set your brokerage timezone in **Admin > Settings > Timezone**. All daily boundaries, streaks, and leaderboard periods use this timezone. Uses IANA timezone names (e.g., `America/New_York`).

---

## Project Structure

```
src/
  app/
    (auth)/          # Login, signup, password reset
    (dashboard)/     # Main app (home, log, team, admin, settings)
    setup/           # First-run brokerage setup
    auth/callback/   # Supabase auth callback
  components/        # Reusable UI components
  lib/
    supabase/        # Supabase client (browser + server)
    calculations.ts  # Goal math, timezone-aware date helpers
    activities.ts    # Activity definitions and categories
supabase/
  migrations/        # SQL migrations (run in order)
  seed/              # Demo data seed script
```

---

## Database

The app uses **5 SQL migrations** that create 8 tables with full Row Level Security (RLS). Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Extended profiles linked to Supabase Auth |
| `brokerages` | Top-level organization with settings (timezone, goals, rates) |
| `teams` | Groups of agents under a team leader |
| `activity_types` | 19 pre-configured activities with points and categories |
| `activities` | Logged activity instances |
| `goals` | Annual income goals and calculated daily targets |
| `streaks` | Current and longest streak per user |
| `quotes` | Motivational quotes for the dashboard |

All RLS policies use SECURITY DEFINER helper functions to prevent circular dependencies.

---

## Roles

| Role | Capabilities |
|------|-------------|
| **Agent** | Log activities, view own dashboard, set personal goals |
| **Team Leader** | Everything above + view team members' stats |
| **Admin/Broker** | Everything above + manage agents, teams, brokerage settings |

---

## Roadmap

- [ ] PWA support (manifest, service worker, offline queue)
- [ ] Push notifications (streak warnings, goal celebrations)
- [ ] Phone contacts integration (native wrapper)
- [ ] Call logging detection
- [ ] PDF report export

---

## License

[MIT](LICENSE)

---

Built with Next.js, Supabase, and Tailwind CSS.
