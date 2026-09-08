import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usePostgres, getPgDb, getSqliteDb, pgSchema, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getOrCreateTodayChallenge } from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ game: null });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ game: null });
    }

    const date = getChallengeDate();
    const challenge = await getOrCreateTodayChallenge(date);

    if (usePostgres()) {
      const db = getPgDb();
      const games = await db
        .select()
        .from(pgSchema.games)
        .where(
          and(
            eq(pgSchema.games.userId, user.id),
            eq(pgSchema.games.challengeId, challenge.id),
          ),
        )
        .limit(1);

      if (games.length === 0) {
        return NextResponse.json({ game: null });
      }

      const game = games[0];
      return NextResponse.json({
        game: {
          challengeId: game.challengeId,
          status: game.status,
          guesses: game.guessesJson,
          results: game.resultsJson,
          completedAt: game.completedAt?.toISOString(),
        },
      });
    } else {
      const db = getSqliteDb();
      const games = db
        .select()
        .from(schema.games)
        .where(
          and(
            eq(schema.games.userId, user.id),
            eq(schema.games.challengeId, challenge.id),
          ),
        )
        .limit(1)
        .all();

      if (games.length === 0) {
        return NextResponse.json({ game: null });
      }

      const game = games[0];
      return NextResponse.json({
        game: {
          challengeId: game.challengeId,
          status: game.status,
          guesses: JSON.parse(game.guessesJson),
          results: JSON.parse(game.resultsJson),
          completedAt: game.completedAt,
        },
      });
    }
  } catch (error) {
    console.error("[me/today-game] Error:", error);
    return NextResponse.json({ game: null });
  }
}
