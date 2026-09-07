# PokéStatle

Daily Pokémon guessing game inspired by Wordle. Everyone gets the same secret Pokémon each day. Feedback covers types, generation, height, weight, and base stats — with proximity bands and direction arrows (Lucide icons, no emojis).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Framer Motion animations, Outfit font, light/dark themes
- Local SQLite (Drizzle) for gameplay data — synced from PokéAPI
- Supabase Auth (Google) optional for account sync, stats, history, leaderboard
- Custom local Supabase ports (not the defaults): API `54331`, DB `54332`, Studio `54333`

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm sync:pokemon
pnpm dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

`pnpm sync:pokemon` pulls species from PokéAPI, keeps standard forms (Gens I–IX), and upserts into `data/pokestatle.db`. A committed seed file `data/pokestatle.seed.db` is used on Vercel (copied into `/tmp` because the serverless filesystem is read-only). The daily challenge never calls PokéAPI during play.

## Environment

| Variable | Purpose |
|---|---|
| `SECRET_SALT` | Server-only salt for deterministic daily Pokémon |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional — enable Google Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional — Supabase anon key |

Without Supabase credentials the game runs fully in **guest mode** (progress in `localStorage`).

### Google Auth

1. Start or create a Supabase project (`supabase start` uses the custom ports in `supabase/config.toml`).
2. Enable the Google provider and set Client ID/Secret.
3. Add redirect URL: `http://127.0.0.1:43127/api/auth/callback`
4. Copy URL + anon key into `.env.local`.

SQL migrations for Postgres live in `supabase/migrations/`.

## Game rules (short)

- Max 6 guesses
- Attribute feedback: `EXACT` / `VERY_CLOSE` (≤10%) / `CLOSE` (≤25%) / `FAR`, plus up/down
- Types: match / no match per type on the guess
- Future dates are not accessible
- Share text uses emoji squares (🟩🟨🟧⬛) plus direction arrows — without revealing the Pokémon name

## Scripts

- `pnpm dev` — Next.js on port **43127**
- `pnpm sync:pokemon` — refresh local Pokémon pool
- `pnpm build` / `pnpm start` — production

## Buy me a coffee

[buymeacoffee.com/abeldutraui](https://buymeacoffee.com/abeldutraui)
