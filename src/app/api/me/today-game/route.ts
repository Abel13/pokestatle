import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usePostgres, getPgDb, getSqliteDb, pgSchema, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getChallenge } from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    // Get date from query parameter or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam || getChallengeDate();
    
    if (usePostgres()) {
      const db = getPgDb();
      
      // Query by date using join (works for both today and historical)
      const games = await db
        .select({
          challengeId: pgSchema.games.challengeId,
          status: pgSchema.games.status,
          guessesJson: pgSchema.games.guessesJson,
          resultsJson: pgSchema.games.resultsJson,
          completedAt: pgSchema.games.completedAt,
        })
        .from(pgSchema.games)
        .innerJoin(
          pgSchema.dailyChallenges,
          eq(pgSchema.games.challengeId, pgSchema.dailyChallenges.id)
        )
        .where(
          and(
            eq(pgSchema.games.userId, user.id),
            eq(pgSchema.dailyChallenges.date, date),
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
      
      // Query by date using join (works for both today and historical)
      const games = db
        .select({
          challengeId: schema.games.challengeId,
          status: schema.games.status,
          guessesJson: schema.games.guessesJson,
          resultsJson: schema.games.resultsJson,
          completedAt: schema.games.completedAt,
        })
        .from(schema.games)
        .innerJoin(
          schema.dailyChallenges,
          eq(schema.games.challengeId, schema.dailyChallenges.id)
        )
        .where(
          and(
            eq(schema.games.userId, user.id),
            eq(schema.dailyChallenges.date, date),
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
