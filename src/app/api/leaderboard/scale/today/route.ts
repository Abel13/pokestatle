import { NextResponse } from "next/server";
import {
  getOrCreateTodayScaleChallenge,
  getScaleTodayLeaderboard,
} from "@/lib/db/scale";
import { getChallengeDate } from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = getChallengeDate();
    const challenge = await getOrCreateTodayScaleChallenge(date);
    const entries = await getScaleTodayLeaderboard(challenge.id, 25);
    return NextResponse.json({
      challengeId: challenge.id,
      date,
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
