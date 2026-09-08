/**
 * Backfill scores for existing games that don't have scores calculated.
 */
import "dotenv/config";
import { getSqliteDb, schema } from "../src/lib/db";
import { calculateResultScore } from "../src/lib/game/score";
import type { GuessResult } from "../src/lib/game/types";
import { isNull, eq } from "drizzle-orm";

async function main() {
  const db = getSqliteDb();
  
  // Get all games without scores
  const games = db
    .select({
      id: schema.games.id,
      status: schema.games.status,
      resultsJson: schema.games.resultsJson,
    })
    .from(schema.games)
    .where(isNull(schema.games.score))
    .all();

  console.log(`Found ${games.length} games without scores. Calculating...`);

  let updated = 0;
  for (const game of games) {
    if (game.status === "PLAYING") continue;

    try {
      const results = JSON.parse(game.resultsJson) as GuessResult[];
      const won = game.status === "WON";
      const scoreData = calculateResultScore(results, won, 6);

      db.update(schema.games)
        .set({
          score: scoreData.score,
          grade: scoreData.grade,
          efficiency: scoreData.efficiency,
          accuracy: scoreData.accuracy,
        })
        .where(eq(schema.games.id, game.id))
        .run();

      updated++;
      console.log(`  Updated game ${game.id}: ${scoreData.score}/100 (${scoreData.grade})`);
    } catch (err) {
      console.error(`  Failed to update game ${game.id}:`, err);
    }
  }

  console.log(`\nUpdated ${updated}/${games.length} games with scores.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
