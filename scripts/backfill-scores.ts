/**
 * Recalculate Guess them scores for every finished game (SQLite or Postgres).
 *
 *   pnpm score:recalculate
 *   pnpm score:recalculate -- --dry-run
 *
 * Production (after deploy):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://pokestatle.vercel.app/api/cron/recalculate-scores
 */
import "dotenv/config";
import { recalculateFinishedGuessScores } from "../src/lib/db/recalculate-guess-scores";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(
    dryRun
      ? "Dry run: recomputing Guess them scores (no writes)."
      : "Recalculating Guess them scores for finished games...",
  );

  const summary = await recalculateFinishedGuessScores({ dryRun });

  console.log("\n=== Summary ===");
  console.log(`Scanned:    ${summary.scanned}`);
  console.log(`Updated:    ${summary.updated}${dryRun ? " (would update)" : ""}`);
  console.log(`Unchanged:  ${summary.unchanged}`);
  console.log(`Skipped:    ${summary.skipped} (still playing)`);
  console.log(`Errors:     ${summary.errors}`);

  if (summary.deltas.length > 0) {
    console.log("\nSample deltas:");
    for (const d of summary.deltas) {
      console.log(
        `  game ${d.id}: ${d.from ?? "—"}/${d.gradeFrom ?? "—"} → ${d.to}/${d.gradeTo}`,
      );
    }
  }

  if (summary.errorDetails.length > 0) {
    console.log("\nErrors:");
    for (const line of summary.errorDetails) console.log(`  ${line}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Recalculate failed:", err);
    process.exit(1);
  });
