# The VI Wall

A community-built digital monument. Thousands of player tiles form one giant
Roman-numeral **VI**, every tile belongs to a country, and countries compete to
occupy the largest share of the wall.

> **Which country will dominate the VI Wall?**

This is an independent, **unofficial fan project**. It is not affiliated with,
endorsed by, or connected to Rockstar Games or any game publisher. All branding
and artwork are original; no official logos, characters, or screenshots are used.

---

## What's in Phase One

- **Homepage** with the hero, live headline stats, and the VI wall front and centre.
- **Interactive VI wall** — a single `<canvas>` renders thousands of tiles with
  zoom, pan, hover (desktop), tap (mobile), search, and tile highlighting. The
  silhouette is generated deterministically so it renders instantly, even empty.
- **Tile claiming flow** — simple form → email verification → **atomic** tile
  allocation → success screen → shareable profile link.
- **Country leaderboard** — the engagement engine. Ranks, flags, tiles, wall
  percentage, and progress bars, from real database counts.
- **Country battle** — head-to-head comparison of any two countries.
- **Live activity feed** — real `activity_events` only (never fabricated).
- **Public player profiles** at `/player/<username>` with dynamic Open Graph images.
- **Player & country search**, and a per-country player list.
- **Admin console** at `/admin` — server-protected, with moderation actions and
  an audit trail.
- **Premium spotlight** placeholder (no payments, no fake bids in Phase One).
- Legal pages, SEO metadata, sitemap, robots, and configurable analytics.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL) ·
Zod · React Hook Form · Lucide icons · Vitest. Deploys to Vercel; database on
Supabase.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

The app runs **without** Supabase configured: the wall and all pages render, and
stats show honest zeros. Claiming and data features return a clear
"not configured" response until you connect a database — nothing is faked.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit/component tests |
| `npm run gen:tiles` | Regenerate the tile seed SQL (only if you change wall resolution) |

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/0001_init.sql` — schema, constraints, indexes, the
     `country_stats` view, the atomic `verify_and_allocate` / `release_participant_tile`
     functions, RLS, and the country seed.
   - `supabase/migrations/0002_seed_tiles.sql` — one row per tile in the VI
     silhouette (3,418 tiles at the default resolution).
3. In **Settings → API**, copy the Project URL, the `anon` public key, and the
   `service_role` key into your environment (below).

### How data access works (security)

All database reads and writes happen **server-side** using the `service_role`
key, which bypasses RLS. RLS is enabled on every table with **no public
policies**, so the browser's anon key cannot touch the tables directly and
participant emails never reach the client. The `service_role` key is server-only
and must never be prefixed with `NEXT_PUBLIC_`.

---

## Environment variables

See [`.env.example`](./.env.example) for the full list with comments. Summary:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server-only.** Never expose |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL for SEO / OG / share links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Shown on legal/contact pages |
| `AUTO_APPROVE_CLAIMS` | optional | `true` (default) auto-approves verified claims; `false` routes them to the admin queue |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional | Enables real verification emails (via Resend) |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | needed for `/admin` | Password + HMAC secret for the admin cookie |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics; no-op when unset |
| `NEXT_PUBLIC_EVENT_DATE`, `NEXT_PUBLIC_EVENT_TIMEZONE` | optional | Countdown; hidden when unset |
| `NEXT_PUBLIC_WALL_COLS` | optional | Wall resolution (default 132) |

---

## The claim flow (and email verification)

1. User submits the claim form. Server re-validates with Zod, screens content,
   and inserts a `pending_verification` participant. **Unique constraints** on
   normalised username and email prevent duplicates race-safely.
2. A verification link is emailed (Resend) if `RESEND_API_KEY` + `EMAIL_FROM`
   are set. **If email isn't configured**, the claim stays `pending` and, in dev
   only, the verification link is shown on screen — verification is never faked.
3. Clicking the link calls `verify_and_allocate`, which **atomically** verifies
   the email and assigns the next free tile.
4. Success screen shows the tile, country, rank, and a shareable profile link.

With `AUTO_APPROVE_CLAIMS=true` (default) a verified tile counts immediately.
Set it to `false` to require an admin to approve each claim in `/admin`.

### Atomic allocation & concurrency

Tile allocation uses `SELECT ... FOR UPDATE SKIP LOCKED ORDER BY allocation_order
LIMIT 1` inside a Postgres function, plus a `UNIQUE` constraint on
`wall_tiles.participant_id`. This guarantees:

- a tile is never allocated twice;
- a participant never holds two tiles;
- if many users race for the final tile, exactly one wins.

The invariants are unit tested with an in-memory model that mirrors these
semantics (`tests/allocation.test.ts`), including the "100 users race for the
last tile → 1 wins" case.

---

## Admin console

Visit `/admin`. With `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` set, sign in to
see counts (total / pending / verified / approved / occupied / available),
search and filter participants, and **approve / reject / suspend / remove** them.
Every action writes an `admin_actions` audit row. Rejecting, suspending, or
removing a participant frees their tile and lowers the country score
automatically. Authorization is enforced server-side on every admin request.

---

## Testing

```bash
npm run test
```

41 tests cover: VI mask determinism & capacity, the seed-vs-runtime drift guard,
leaderboard ranking / tie-breaking / percentages, country battle comparison,
input validation & moderation, admin session token signing / expiry / tampering,
tile allocation & the concurrency invariant, participant removal updating the
country score, and component rendering with empty states.

> The database-level guarantees (unique constraints, `FOR UPDATE SKIP LOCKED`)
> are enforced by Postgres. The allocation tests validate the same semantics via
> a faithful in-memory model so they run without a live database in CI.

---

## Deploying to Vercel

1. Push this project to a Git repository.
2. Import it in Vercel. Framework preset: **Next.js** (auto-detected).
3. Add all environment variables from `.env.example` in
   **Project → Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to
   your production URL.
4. Ensure the Supabase migrations have been applied to your database.
5. Deploy. The build command is `next build` (default); no extra config needed.

---

## Performance notes

- The wall is one `<canvas>`, not thousands of DOM nodes.
- The `/api/wall` endpoint returns only **occupied** tiles; empty positions are
  generated on the client, keeping payloads small.
- Public endpoints send `Cache-Control` headers; server pages use short
  revalidation; client widgets poll gently (10–20s), not aggressively.
- Leaderboard counts come from an indexed `country_stats` view.

---

## Known limitations & future work

- **Rate limiting** is in-memory (fine for a single instance / Phase One). For
  multi-instance deployments, swap `lib/rate-limit.ts` for a shared store
  (e.g. Upstash Redis) — the interface is intentionally small.
- **Realtime**: the activity feed uses gentle polling. Supabase Realtime can be
  added later if sub-second updates are needed.
- **Avatar uploads**: Phase One ships original procedural avatar presets. The
  schema has an `avatar_url` column for a future validated upload flow (size /
  type restrictions, safe hosting) — arbitrary file uploads are intentionally
  not enabled yet.
- **Admin auth** is a shared password + signed cookie. The `admin_users` table
  is in place to grow into full role-based Supabase Auth without schema changes.
- **Spotlight / bidding / payments** are a deliberate P2 placeholder; no payment
  code ships in Phase One, and spotlight can never affect country rankings.
- **Profanity filter** is a small first-pass screen; the admin moderation queue
  is the real safety net.

---

## Project structure

```
app/            Routes (pages + API) — App Router
  api/          Server endpoints (stats, wall, leaderboard, claim, verify, admin, …)
  player/       Public profiles + dynamic OG image
  admin/        Server-protected moderation console
components/     React components (ViWall canvas, Leaderboard, ClaimForm, …)
lib/            Pure logic & data access (vi-mask, scoring, validation, data, auth, …)
supabase/       SQL migrations (schema + tile seed)
scripts/        Tile seed generator
tests/          Vitest suites
```
