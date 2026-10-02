import { eq } from "drizzle-orm";
import {
  getPgDb,
  getSqliteDb,
  pgSchema,
  schema,
  usePostgres,
} from "@/lib/db";
import { calculateResultScore } from "@/lib/game/score";
import { MAX_GUESSES, type GuessResult } from "@/lib/game/types";

export type RecalculateGuessScoresSummary = {
  scanned: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  deltas: Array<{
    id: number;
    from: number | null;
    to: number;
    gradeFrom: string | null;
    gradeTo: string;
  }>;
  errorDetails: string[];
};

function parseResults(value: unknown): GuessResult[] {
  if (Array.isArray(value)) return value as GuessResult[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as GuessResult[];
    } catch {
      return [];
    }
  }
  return [];
}

const DELTA_SAMPLE = 25;

/**
 * Recompute score / grade / efficiency / accuracy for every finished Guess them game.
 * Leaderboards read these columns, so this is the retroactive recalc.
 */
export async function recalculateFinishedGuessScores(options?: {
  dryRun?: boolean;
}): Promise<RecalculateGuessScoresSummary> {
  const dryRun = Boolean(options?.dryRun);
  const summary: RecalculateGuessScoresSummary = {
    scanned: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    errors: 0,
    dryRun,
    deltas: [],
    errorDetails: [],
  };

  if (usePostgres()) {
    const db = getPgDb();
    const rows = await db
      .select({
        id: pgSchema.games.id,
        status: pgSchema.games.status,
        resultsJson: pgSchema.games.resultsJson,
        score: pgSchema.games.score,
        grade: pgSchema.games.grade,
        efficiency: pgSchema.games.efficiency,
        accuracy: pgSchema.games.accuracy,
      })
      .from(pgSchema.games);

    const updates: Array<{
      id: number;
      score: number;
      grade: string;
      efficiency: number;
      accuracy: number;
    }> = [];

    for (const row of rows) {
      summary.scanned += 1;
      if (row.status !== "WON" && row.status !== "LOST") {
        summary.skipped += 1;
        continue;
      }

      try {
        const results = parseResults(row.resultsJson);
        const next = calculateResultScore(
          results,
          row.status === "WON",
          MAX_GUESSES,
        );
        const same =
          row.score === next.score &&
          row.grade === next.grade &&
          row.efficiency === next.efficiency &&
          row.accuracy === next.accuracy;

        if (same) {
          summary.unchanged += 1;
          continue;
        }

        summary.updated += 1;
        if (summary.deltas.length < DELTA_SAMPLE) {
          summary.deltas.push({
            id: row.id,
            from: row.score,
            to: next.score,
            gradeFrom: row.grade,
            gradeTo: next.grade,
          });
        }
        updates.push({
          id: row.id,
          score: next.score,
          grade: next.grade,
          efficiency: next.efficiency,
          accuracy: next.accuracy,
        });
      } catch (err) {
        summary.errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        summary.errorDetails.push(`game ${row.id}: ${msg}`);
      }
    }

    if (!dryRun) {
      for (const next of updates) {
        await db
          .update(pgSchema.games)
          .set({
            score: next.score,
            grade: next.grade,
            efficiency: next.efficiency,
            accuracy: next.accuracy,
          })
          .where(eq(pgSchema.games.id, next.id));
      }
    }

    return summary;
  }

  const db = getSqliteDb();
  const rows = db
    .select({
      id: schema.games.id,
      status: schema.games.status,
      resultsJson: schema.games.resultsJson,
      score: schema.games.score,
      grade: schema.games.grade,
      efficiency: schema.games.efficiency,
      accuracy: schema.games.accuracy,
    })
    .from(schema.games)
    .all();

  for (const row of rows) {
    summary.scanned += 1;
    if (row.status !== "WON" && row.status !== "LOST") {
      summary.skipped += 1;
      continue;
    }

    try {
      const results = parseResults(row.resultsJson);
      const next = calculateResultScore(
        results,
        row.status === "WON",
        MAX_GUESSES,
      );
      const same =
        row.score === next.score &&
        row.grade === next.grade &&
        row.efficiency === next.efficiency &&
        row.accuracy === next.accuracy;

      if (same) {
        summary.unchanged += 1;
        continue;
      }

      summary.updated += 1;
      if (summary.deltas.length < DELTA_SAMPLE) {
        summary.deltas.push({
          id: row.id,
          from: row.score,
          to: next.score,
          gradeFrom: row.grade,
          gradeTo: next.grade,
        });
      }

      if (!dryRun) {
        db.update(schema.games)
          .set({
            score: next.score,
            grade: next.grade,
            efficiency: next.efficiency,
            accuracy: next.accuracy,
          })
          .where(eq(schema.games.id, row.id))
          .run();
      }
    } catch (err) {
      summary.errors += 1;
      const msg = err instanceof Error ? err.message : String(err);
      summary.errorDetails.push(`game ${row.id}: ${msg}`);
    }
  }

  return summary;
}
