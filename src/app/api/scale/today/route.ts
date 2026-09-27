import { NextResponse } from "next/server";
import { getChallengeDate } from "@/lib/game/daily";
import { buildScaleChallengePublic } from "@/lib/db/scale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = getChallengeDate();
    const challenge = await buildScaleChallengePublic(date);
    return NextResponse.json(challenge);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load scale challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
