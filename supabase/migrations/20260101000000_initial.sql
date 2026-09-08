-- PokéStatle initial schema for Supabase Postgres
-- Mirror of the local SQLite schema used by the Next.js app runtime.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.difficulty as enum ('EASY', 'NORMAL', 'HARD', 'EXPERT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.game_status as enum ('PLAYING', 'WON', 'LOST');
exception when duplicate_object then null;
end $$;

create table if not exists public.pokemon (
  id integer primary key,
  name text not null,
  slug text not null unique,
  generation integer not null,
  height integer not null,
  weight integer not null,
  hp integer not null,
  attack integer not null,
  defense integer not null,
  special_attack integer not null,
  special_defense integer not null,
  speed integer not null,
  base_stat_total integer not null,
  is_legendary boolean not null default false,
  is_mythical boolean not null default false,
  evolves_from integer,
  evolution_stage integer not null default 1,
  sprite text not null,
  difficulty public.difficulty not null default 'NORMAL',
  types_json jsonb not null default '[]'::jsonb
);

create table if not exists public.daily_challenges (
  id integer primary key,
  date date not null unique,
  pokemon_id integer not null references public.pokemon(id),
  difficulty public.difficulty not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id integer not null references public.daily_challenges(id),
  status public.game_status not null,
  guesses_json jsonb not null default '[]'::jsonb,
  results_json jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  played integer not null default 0,
  wins integer not null default 0,
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  distribution_json jsonb not null default '[0,0,0,0,0,0]'::jsonb,
  last_challenge_id integer
);

alter table public.pokemon enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.user_stats enable row level security;

-- Public read of pokemon catalog
create policy "pokemon_read" on public.pokemon for select using (true);

-- Challenge metadata readable, but pokemon_id should be queried only via service role in production APIs.
-- For defense in depth, deny client select of daily_challenges; Route Handlers use service role.
create policy "challenges_no_client_read" on public.daily_challenges
  for select using (false);

create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "games_own" on public.games
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "stats_own" on public.user_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leaderboard: allow reading completed games' aggregate-friendly columns via a view without secret pokemon
create or replace view public.leaderboard_today with (security_invoker = true) as
select
  g.challenge_id,
  g.user_id,
  p.display_name,
  p.avatar_url,
  jsonb_array_length(g.guesses_json) as guesses,
  g.completed_at,
  s.current_streak,
  s.max_streak
from public.games g
join public.profiles p on p.id = g.user_id
left join public.user_stats s on s.user_id = g.user_id
where g.status = 'WON';
