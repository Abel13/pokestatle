import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getChallenge, getPoolSize } from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";
import { todayChallengeCache } from "@/lib/cache";

export const runtime = "nodejs";
/** Allow CDN / Next data cache for this public, once-daily payload. */
export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

type TodayChallengePayload = {
  id: number;
  date: string;
  maxGuesses: number;
  pokemonPoolSize: number;
  difficulty: string;
};

/**
 * Cross-instance cache for today's public challenge payload.
 * Keyed by challenge date so midnight BRT rolls to a new entry.
 */
const loadTodayChallenge = unstable_cache(
  async (date: string): Promise<TodayChallengePayload | null> => {
    const challenge = await getChallenge(date);
    if (!challenge) return null;

    const pokemonPoolSize = await getPoolSize();
    return {
      id: challenge.id,
      date: challenge.date,
      maxGuesses: MAX_GUESSES,
      pokemonPoolSize,
      difficulty: challenge.difficulty,
    };
  },
  ["challenge-today"],
  { revalidate: 60, tags: ["challenge-today"] },
);

function jsonChallenge(payload: TodayChallengePayload) {
  return NextResponse.json(payload, { headers: CACHE_HEADERS });
}

export async function GET() {
  try {
    const date = getChallengeDate();

    // 1. Warm instance memory (no DB) — pool size is stored with the entry
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

    // 2. Next.js data cache / DB
    const challenge = await loadTodayChallenge(date);

    if (!challenge) {
      return NextResponse.json(
        { error: "Today's challenge not available yet. Please try again later." },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    // 3. Warm instance memory for subsequent hits on this isolate
    todayChallengeCache.set(
      date,
      {
        id: challenge.id,
        date: challenge.date,
        difficulty: challenge.difficulty,
        pokemonPoolSize: challenge.pokemonPoolSize,
      },
      5 * 60 * 1000,
    );

    return jsonChallenge(challenge);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load challenge";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
