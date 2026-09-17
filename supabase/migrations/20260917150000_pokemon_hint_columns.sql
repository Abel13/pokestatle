-- Hint data for progressive round reveals
alter table public.pokemon
  add column if not exists evolution_line_length integer not null default 1,
  add column if not exists primary_color text,
  add column if not exists secondary_color text;
