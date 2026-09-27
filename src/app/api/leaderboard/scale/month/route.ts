import { NextResponse } from "next/server";
import { getScaleMonthlyLeaderboard } from "@/lib/db/scale";
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
    const entries = await getScaleMonthlyLeaderboard(startDate, endDate, 25);
    return NextResponse.json({
      yearMonth,
      startDate,
      endDate,
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load monthly leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
