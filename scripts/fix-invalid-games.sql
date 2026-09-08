-- PostgreSQL: Corrige jogos com mais de 6 palpites
-- Identifica e corrige jogos inválidos no Supabase

-- 1. Ver jogos com problema (apenas para conferir)
SELECT 
  id,
  user_id,
  challenge_id,
  status,
  jsonb_array_length(guesses_json) as guess_count,
  jsonb_array_length(results_json) as result_count,
  completed_at
FROM public.games
WHERE jsonb_array_length(guesses_json) > 6
ORDER BY jsonb_array_length(guesses_json) DESC;

-- 2. Corrigir os jogos inválidos
-- Esta query mantém apenas os primeiros 6 palpites e atualiza o status
UPDATE public.games
SET 
  guesses_json = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(guesses_json) WITH ORDINALITY elem
      WHERE ordinality <= 6
    ) sub
  ),
  results_json = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(results_json) WITH ORDINALITY elem
      WHERE ordinality <= 6
    ) sub
  ),
  status = CASE
    -- Se o 6º palpite não foi correto, marca como LOST
    WHEN status = 'PLAYING' AND 
         jsonb_array_length(guesses_json) >= 6 AND
         NOT (results_json->5->>'isCorrect')::boolean
    THEN 'LOST'::game_status
    -- Se acertou em até 6 tentativas, mantém WON
    WHEN status = 'WON' THEN 'WON'::game_status
    -- Caso contrário, mantém o status atual
    ELSE status
  END,
  completed_at = CASE
    WHEN status = 'PLAYING' AND jsonb_array_length(guesses_json) >= 6
    THEN COALESCE(completed_at, NOW())
    ELSE completed_at
  END
WHERE jsonb_array_length(guesses_json) > 6;

-- 3. Verificar resultado (deve retornar 0 linhas)
SELECT 
  id,
  user_id,
  challenge_id,
  status,
  jsonb_array_length(guesses_json) as guess_count,
  jsonb_array_length(results_json) as result_count
FROM public.games
WHERE jsonb_array_length(guesses_json) > 6;

-- 4. Recalcular scores para os jogos corrigidos (opcional)
-- Você pode executar o script backfill-scores.ts depois disso
