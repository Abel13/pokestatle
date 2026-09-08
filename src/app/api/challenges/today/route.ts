import { NextResponse } from "next/server";
import {
  getOrCreateTodayChallenge,
  getPoolSize,
} from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = getChallengeDate();
    const challenge = await getOrCreateTodayChallenge(date);
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
