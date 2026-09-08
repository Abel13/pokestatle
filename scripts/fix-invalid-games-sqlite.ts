/**
 * Corrige jogos com mais de 6 palpites no SQLite
 * Execute com: pnpm exec tsx scripts/fix-invalid-games-sqlite.ts
 */
import Database from "better-sqlite3";
import { join } from "path";
import { existsSync } from "fs";

const dbPath = join(process.cwd(), "data", "pokestatle.db");

if (!existsSync(dbPath)) {
  console.log("❌ Database file not found at:", dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  console.log("🔍 Buscando jogos com mais de 6 palpites...");

  const invalidGames = db
    .prepare(
      `SELECT 
        id, 
        user_id, 
        challenge_id, 
        status, 
        guesses_json, 
        results_json,
        completed_at
      FROM games
      WHERE json_array_length(guesses_json) > 6`
    )
    .all();

  console.log(`\n📊 Encontrados ${invalidGames.length} jogos inválidos\n`);

  if (invalidGames.length === 0) {
    console.log("✅ Nenhum jogo inválido encontrado!");
    process.exit(0);
  }

  // Mostrar detalhes dos jogos inválidos
  invalidGames.forEach((game: any) => {
    const guesses = JSON.parse(game.guesses_json);
    const results = JSON.parse(game.results_json);
    console.log(
      `  Game ID ${game.id}: ${guesses.length} palpites, status: ${game.status}`
    );
  });

  console.log("\n🔧 Corrigindo jogos...\n");

  const updateStmt = db.prepare(`
    UPDATE games
    SET 
      guesses_json = ?,
      results_json = ?,
      status = ?,
      completed_at = ?
    WHERE id = ?
  `);

  let fixed = 0;

  db.transaction(() => {
    for (const game of invalidGames as any[]) {
      const guesses = JSON.parse(game.guesses_json);
      const results = JSON.parse(game.results_json);

      // Manter apenas os primeiros 6 palpites
      const fixedGuesses = guesses.slice(0, 6);
      const fixedResults = results.slice(0, 6);

      // Determinar status correto
      let newStatus = game.status;
      const lastResult = fixedResults[fixedResults.length - 1];

      if (fixedGuesses.length >= 6 && !lastResult?.isCorrect) {
        newStatus = "LOST";
      } else if (lastResult?.isCorrect) {
        newStatus = "WON";
      }

      // Garantir que completed_at está definido
      const completedAt =
        newStatus !== "PLAYING"
          ? game.completed_at || new Date().toISOString()
          : null;

      updateStmt.run(
        JSON.stringify(fixedGuesses),
        JSON.stringify(fixedResults),
        newStatus,
        completedAt,
        game.id
      );

      console.log(
        `  ✅ Game ${game.id}: ${guesses.length} → ${fixedGuesses.length} palpites, status: ${newStatus}`
      );
      fixed++;
    }
  })();

  console.log(`\n✅ ${fixed} jogos corrigidos com sucesso!`);

  // Verificar se ainda há jogos inválidos
  const remaining = db
    .prepare(
      "SELECT COUNT(*) as count FROM games WHERE json_array_length(guesses_json) > 6"
    )
    .get() as { count: number };

  if (remaining.count > 0) {
    console.log(`\n⚠️  Ainda existem ${remaining.count} jogos inválidos!`);
  } else {
    console.log("\n✅ Todos os jogos inválidos foram corrigidos!");
  }
} catch (error) {
  console.error("❌ Erro ao corrigir jogos:", error);
  process.exit(1);
} finally {
  db.close();
}
