import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getChallenge, getPoolSize } from "@/lib/db/queries";
import { assertNotFuture } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";

export const runtime = "nodejs";
export const revalidate = 300;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};

const loadChallengeByDate = unstable_cache(
  async (date: string) => {
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
  ["challenge-by-date"],
  { revalidate: 300, tags: ["challenge-by-date"] },
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    assertNotFuture(date);

    const challenge = await loadChallengeByDate(date);

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge for this date doesn't exist." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(challenge, { headers: CACHE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load challenge";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
