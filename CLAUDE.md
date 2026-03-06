# CLAUDE.md - Daily Prospect Tracker

## Project Overview

Mobile-first daily activity tracker for real estate agents. Point-based gamification with team leaderboards and admin controls.

## Tech Stack

- **Frontend/Backend:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Vercel

## Key Architecture Decisions

- **Timezone handling:** All date boundaries computed server-side in the brokerage's IANA timezone (stored in `brokerages.settings.timezone`). Helper functions in `src/lib/calculations.ts` accept an optional timezone parameter.
- **RLS policies:** Use SECURITY DEFINER helper functions (`get_user_role()`, `get_user_team_id()`, etc.) to prevent infinite recursion from cross-table policy references.
- **Never use `search_path = ''`** on functions that call `auth.uid()`. Use `SET search_path = 'public', 'auth'` instead.

## Commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm run lint   # ESLint
```

## Design Principles

- Mobile-first (90% phone usage)
- 30-second input (large tap targets, no typing required)
- Minimum tap targets: 48x48px
- No modals on mobile -- use full-screen pages
- Animate point changes for satisfying feedback
- No em-dashes in user-facing text
