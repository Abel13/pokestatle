-- Add score, grade, efficiency, and accuracy columns to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS score integer,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS efficiency integer,
  ADD COLUMN IF NOT EXISTS accuracy integer;
