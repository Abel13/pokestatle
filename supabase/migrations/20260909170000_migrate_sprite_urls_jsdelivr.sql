-- One-shot production backfill: GitHub raw sprite URLs → jsDelivr CDN.
-- Run in Supabase SQL Editor if deploy-time migration did not apply.

UPDATE public.pokemon
SET sprite = replace(
  sprite,
  'https://raw.githubusercontent.com/PokeAPI/sprites/master',
  'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master'
)
WHERE sprite LIKE 'https://raw.githubusercontent.com/PokeAPI/sprites/master%';

UPDATE public.pokemon
SET sprite =
  'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/'
  || id::text
  || '.png'
WHERE sprite IS NULL OR sprite = '';

SELECT
  count(*) AS total,
  count(*) FILTER (WHERE sprite LIKE '%raw.githubusercontent%') AS github,
  count(*) FILTER (WHERE sprite LIKE '%cdn.jsdelivr.net%') AS jsdelivr,
  count(*) FILTER (WHERE sprite IS NULL OR sprite = '') AS empty
FROM public.pokemon;
