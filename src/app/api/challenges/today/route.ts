import { NextResponse } from "next/server";
import {
  getChallenge,
  getPoolSize,
} from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";
import { todayChallengeCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = getChallengeDate();
    
    // 1. Try cache first (valid for 5 minutes)
    const cached = todayChallengeCache.get(date);
    if (cached) {
      return NextResponse.json({
        id: cached.id,
        date: cached.date,
        maxGuesses: MAX_GUESSES,
        pokemonPoolSize: await getPoolSize(),
        difficulty: cached.difficulty,
      });
    }
    
    // 2. Fetch from database (does not create)
    const challenge = await getChallenge(date);
    
    if (!challenge) {
      return NextResponse.json(
        { error: "Today's challenge not available yet. Please try again later." },
        { status: 503 } // Service Unavailable
      );
    }
    
    // 3. Save to cache (5 minutes)
    todayChallengeCache.set(date, challenge, 5 * 60 * 1000);
    
    return NextResponse.json({
      id: challenge.id,
      date: challenge.date,
      maxGuesses: MAX_GUESSES,
      pokemonPoolSize: await getPoolSize(),
      difficulty: challenge.difficulty,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
