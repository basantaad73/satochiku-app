# 佐藤畜産食品株式会社 — 社内アプリ

Private internal communication & work-management app. Phase 1: project setup,
database, authentication, roles, and a responsive dashboard shell.

## Stack

Next.js 14 (App Router, TypeScript) + Supabase (Postgres, Auth, Realtime,
Storage) + Tailwind CSS. See the chat history for the full rationale —
short version: generous free tier, RLS enforces permissions in the
database (not just hidden UI), realtime and storage are built in, and
it's plain Postgres underneath so you're never locked in.

## 1. Set up Supabase

1. Create a free project at supabase.com.
2. In the SQL Editor, run the three files in `supabase/migrations/` **in
   order** (0001, then 0002, then 0003).
3. In Project Settings → API, copy the Project URL, anon key, and
   service role key into a `.env.local` (copy `.env.example` first).
4. In Authentication → Providers, disable "Enable email signups" —
   this app never lets people self-register; only invited-by-admin.
5. In Authentication → Email Templates, you may want to customize the
   invite email to be in Japanese.

## 2. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to /login.

## 3. Create the first administrator

There is intentionally no signup form and no hard-coded admin account
(section 38 of the spec). Bootstrap the first admin from the Supabase
dashboard directly, once, by hand:

1. Authentication → Users → "Add user" → enter your email, set "Auto
   Confirm User" on, and send yourself an invite (or set a password
   directly for this one-time bootstrap).
2. Table Editor → `profiles` → find the row that was auto-created for
   that user (the `handle_new_user` trigger creates it) → set `role`
   to `admin`.
3. Log in at `/login`. From here on, use the in-app Admin Panel
   (`/admin/users`) to invite every other employee — no more manual
   dashboard steps needed.

## 4. Deploy

Push this repo to GitHub, import it into Vercel, set the same
environment variables from `.env.local` in the Vercel project settings,
and deploy. `NEXT_PUBLIC_SITE_URL` should be your real production URL
(needed for password-reset/invite email links to work).

## 5. Storage & cost

At 10–30 employees doing normal text/photo chat, this runs at **$0/month**
on free tiers:

| Layer | Free tier | What happens over the limit |
|---|---|---|
| Hosting (Vercel) | 100GB bandwidth/mo, unlimited sites | Slows/blocks past quota; unlikely at this scale |
| Database (Supabase) | 500MB Postgres | Messages/notes/metadata are tiny text — this will last years |
| File storage (Supabase) | 1GB | **This is the one that fills up** — see below |
| Realtime (Supabase) | 200 concurrent connections | Plenty for 30 employees |

Photos and videos are the only things that meaningfully use storage.
Two ways to stay on the free tier indefinitely, and they combine well:

- **Admin cleanup (built in)**: `/admin/storage` shows total usage, a
  breakdown by type, the 25 largest files, and lets an admin delete
  individual files or bulk-delete anything older than 30/90/180/365
  days. Files marked "重要な写真として保存" at upload time are skipped by
  bulk cleanup, so important company photos aren't accidentally lost.
- **Upgrade if/when you want to stop managing it manually**: Supabase
  Pro is $25/month for 100GB. Nothing in the architecture needs to
  change to move to this later — it's the same buckets, same code.

## 6. Backups

- Supabase free tier does **not** include automated backups. Two options,
  from least to most effort:
  1. Manual: Table Editor → export any table to CSV periodically, or run
     `pg_dump` against the connection string in Project Settings →
     Database.
  2. Supabase Pro ($25/mo) includes daily automated backups with
     point-in-time recovery.
- Storage (photos/files) isn't covered by `pg_dump` — back it up
  separately if needed, e.g. periodically syncing the `company-files`
  and `chat-media` buckets to Google Drive or another cheap object
  store, before running the admin cleanup tool.
- Restoring: re-run the migrations in `supabase/migrations/` against a
  fresh project, then restore table data from your CSV/dump export.

## Project structure

```
app/(auth)/        login, password reset, and their server actions
app/(dashboard)/   the main app shell (protected by middleware.ts + layout)
app/admin/         admin-only panel (protected 3x: middleware, layout, actions)
components/        shared UI (nav, phase-notice placeholder)
lib/                supabase clients, config, nav config, validation schemas
supabase/migrations/  full SQL schema + RLS policies, run in order
types/database.ts  hand-written DB types (regenerate via `npm run db:types`)
```

## Roadmap (unbuilt phases)

Phase 2: 1-to-1 + group chat, realtime messaging
Phase 3: photo/video/file sharing with compression
Phase 4: personal/shared notes, announcements, search, notifications
Phase 5: remaining admin panel sections (groups, announcements, system)
Phase 6: full PWA polish, performance, security hardening
Phase 7: automated tests, production deployment docs

Routes for the unbuilt sections exist already and are honestly labeled
"in development" rather than faked — see `components/PhaseNotice.tsx`.
