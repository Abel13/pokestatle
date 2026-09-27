import { NextRequest, NextResponse } from "next/server";
import { getChallengeDate } from "@/lib/game/daily";
import { buildScaleChallengePublic } from "@/lib/db/scale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date");
    const date =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : getChallengeDate();
    const challenge = await buildScaleChallengePublic(date);
    return NextResponse.json(challenge);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load scale challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
