import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usePostgres, getPgDb, getSqliteDb, pgSchema, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getOrCreateTodayChallenge } from "@/lib/db/queries";
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
    
    // For historical dates (not today), skip challenge creation and just query by date
    const isToday = date === getChallengeDate();
    
    if (usePostgres()) {
      const db = getPgDb();
      
      if (isToday) {
        // For today, ensure challenge exists
        const challenge = await getOrCreateTodayChallenge(date);
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
        // For historical dates, query directly by date via join
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
      }
    } else {
      const db = getSqliteDb();
      
      if (isToday) {
        const challenge = await getOrCreateTodayChallenge(date);
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
      } else {
        // For historical dates, query directly by date
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
    }
  } catch (error) {
    console.error("[me/today-game] Error:", error);
    return NextResponse.json({ game: null });
  }
}
