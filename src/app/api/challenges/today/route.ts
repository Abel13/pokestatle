import { NextResponse } from "next/server";
import { getOrCreateTodayChallenge, getPoolSize } from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";
import { todayChallengeCache } from "@/lib/cache";

export const runtime = "nodejs";
/** Never CDN-cache this date-less URL — stale "today" was serving old day numbers. */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

type TodayChallengePayload = {
  id: number;
  date: string;
  maxGuesses: number;
  pokemonPoolSize: number;
  difficulty: string;
};

function jsonChallenge(payload: TodayChallengePayload) {
  return NextResponse.json(payload, { headers: NO_STORE });
}

export async function GET() {
  try {
    const date = getChallengeDate();

    // 1. Warm instance memory (no DB) — keyed by challenge date
    const cached = todayChallengeCache.get(date);
    if (cached) {
      return jsonChallenge({
        id: cached.id,
        date: cached.date,
        maxGuesses: MAX_GUESSES,
        pokemonPoolSize: cached.pokemonPoolSize,
        difficulty: cached.difficulty,
      });
    }

    // 2. Materialize if cron missed this day, then serve
    const challenge = await getOrCreateTodayChallenge(date);
    const pokemonPoolSize = await getPoolSize();

    todayChallengeCache.set(
      date,
      {
        id: challenge.id,
        date: challenge.date,
        difficulty: challenge.difficulty,
        pokemonPoolSize,
      },
      5 * 60 * 1000,
    );

    return jsonChallenge({
      id: challenge.id,
      date: challenge.date,
      maxGuesses: MAX_GUESSES,
      pokemonPoolSize,
      difficulty: challenge.difficulty,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load challenge";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE },
    );
  }
}
