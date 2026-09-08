# PokéStatle

Daily Pokémon guessing game inspired by Wordle. Everyone gets the same secret Pokémon each day. Feedback covers types, generation, height, weight, and base stats — with proximity bands and direction arrows (Lucide icons, no emojis).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Framer Motion animations, Outfit font, light/dark themes
- Local SQLite (Drizzle) for offline/guest gameplay
- Supabase Auth (Google) + Postgres for production catalog, games, stats, leaderboard
- Custom local Supabase ports (not the defaults): API `54331`, DB `54332`, Studio `54333`

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm sync:pokemon
pnpm dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

`pnpm sync:pokemon` pulls species from PokéAPI, keeps standard forms (Gens I–IX), and upserts into `data/pokestatle.db`. A committed seed file `data/pokestatle.seed.db` backs local/Vercel fallback when `DATABASE_URL` is unset.

## Environment

| Variable | Purpose |
|---|---|
| `SECRET_SALT` | Server-only salt for deterministic daily Pokémon |
| `NEXT_PUBLIC_SUPABASE_URL` | Enable Google Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` / `POSTGRES_URL` / `STORAGE_POSTGRES_URL` | Supabase Postgres URI (any of these names works) |

Without Supabase credentials the game runs fully in **guest mode** (progress in `localStorage`, SQLite catalog).

### Google Auth + empty Supabase DB

Auth env vars alone do **not** create tables or seed Pokémon. After connecting the project:

1. Enable the Google provider and set Client ID/Secret.
2. Add redirect URL: `https://pokestatle.vercel.app/api/auth/callback` (and local if needed).
3. Ensure a Postgres URL is present on Vercel — usually `POSTGRES_URL` or `STORAGE_POSTGRES_URL` from the Supabase integration (the app accepts those names; `DATABASE_URL` is optional).
4. Run `pnpm db:push-supabase` once (with that URL in `.env.local`) to apply migrations and seed `public.pokemon`.
5. Redeploy Vercel so production uses Postgres.

SQL migrations live in `supabase/migrations/`.

## Game rules (short)

- Max 6 guesses
- Attribute feedback: far → direction only; close/exact → color only
- Types: match / no match per type on the guess
- Result score 0–100 + letter grade
- Share text uses emoji without revealing the Pokémon name

## Scripts

- `pnpm dev` — Next.js on port **43127**
- `pnpm sync:pokemon` — refresh local Pokémon pool (SQLite)
- `pnpm db:push-supabase` — apply schema + seed Supabase Postgres from local seed
- `pnpm challenge:today` — materialize today's challenge row
- `pnpm build` / `pnpm start` — production

## Buy me a coffee

[buymeacoffee.com/abeldutraui](https://buymeacoffee.com/abeldutraui)
