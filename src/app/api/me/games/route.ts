import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usePostgres, getPgDb, getSqliteDb, pgSchema, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ games: [] });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ games: [] });
    }

    if (usePostgres()) {
      const db = getPgDb();
      const games = await db
        .select({
          challengeId: pgSchema.games.challengeId,
          status: pgSchema.games.status,
          guessesJson: pgSchema.games.guessesJson,
          resultsJson: pgSchema.games.resultsJson,
          completedAt: pgSchema.games.completedAt,
          score: pgSchema.games.score,
          grade: pgSchema.games.grade,
          date: pgSchema.dailyChallenges.date,
        })
        .from(pgSchema.games)
        .innerJoin(
          pgSchema.dailyChallenges,
          eq(pgSchema.games.challengeId, pgSchema.dailyChallenges.id),
        )
        .where(eq(pgSchema.games.userId, user.id));

      return NextResponse.json({
        games: games.map((game) => ({
          challengeId: game.challengeId,
          date: game.date,
          status: game.status,
          guesses: game.guessesJson,
          results: game.resultsJson,
          completedAt: game.completedAt?.toISOString(),
          score: game.score,
          grade: game.grade,
        })),
      });
    } else {
      const db = getSqliteDb();
      const games = db
        .select({
          challengeId: schema.games.challengeId,
          status: schema.games.status,
          guessesJson: schema.games.guessesJson,
          resultsJson: schema.games.resultsJson,
          completedAt: schema.games.completedAt,
          score: schema.games.score,
          grade: schema.games.grade,
          date: schema.dailyChallenges.date,
        })
        .from(schema.games)
        .innerJoin(
          schema.dailyChallenges,
          eq(schema.games.challengeId, schema.dailyChallenges.id),
        )
        .where(eq(schema.games.userId, user.id))
        .all();

      return NextResponse.json({
        games: games.map((game) => ({
          challengeId: game.challengeId,
          date: game.date,
          status: game.status,
          guesses: JSON.parse(game.guessesJson),
          results: JSON.parse(game.resultsJson),
          completedAt: game.completedAt,
          score: game.score,
          grade: game.grade,
        })),
      });
    }
  } catch (error) {
    console.error("[me/games] Error:", error);
    return NextResponse.json({ games: [] });
  }
}
