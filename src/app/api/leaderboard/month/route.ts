import { NextResponse } from "next/server";
import { getMonthlyLeaderboard } from "@/lib/db/games";
import {
  getChallengeDate,
  getChallengeMonthBounds,
} from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = getChallengeDate();
    const { yearMonth, startDate, endDate } = getChallengeMonthBounds(today);
    const entries = await getMonthlyLeaderboard(startDate, endDate, 25);
    return NextResponse.json({
      yearMonth,
      startDate,
      endDate,
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load monthly leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
