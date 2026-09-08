import { NextResponse } from "next/server";
import { getChallenge, getPoolSize } from "@/lib/db/queries";
import { assertNotFuture } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    // Prevent future challenges
    assertNotFuture(date);

    // For historical dates, only fetch (do not create)
    const challenge = await getChallenge(date);
    
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge for this date doesn't exist." },
        { status: 404 }
      );
    }
    
    const poolSize = await getPoolSize();

    return NextResponse.json({
      id: challenge.id,
      date: challenge.date,
      maxGuesses: MAX_GUESSES,
      pokemonPoolSize: poolSize,
      difficulty: challenge.difficulty,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
