-- SQLite: Corrige jogos com mais de 6 palpites
-- Para uso em desenvolvimento local

-- 1. Ver jogos com problema (apenas para conferir)
SELECT 
  id,
  user_id,
  challenge_id,
  status,
  json_array_length(guesses_json) as guess_count,
  json_array_length(results_json) as result_count,
  completed_at
FROM games
WHERE json_array_length(guesses_json) > 6
ORDER BY json_array_length(guesses_json) DESC;

-- 2. Backup dos dados antes de corrigir (recomendado)
CREATE TABLE IF NOT EXISTS games_backup_invalid AS
SELECT * FROM games WHERE json_array_length(guesses_json) > 6;

-- 3. Para SQLite, precisamos usar um script TypeScript porque
--    SQLite não tem funções JSON tão avançadas quanto PostgreSQL
--    Veja fix-invalid-games-sqlite.ts
