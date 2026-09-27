import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChallengeDate } from "@/lib/game/daily";
import {
  buildScaleChallengePublic,
  getOrCreateTodayScaleChallenge,
  getScaleGameProgress,
} from "@/lib/db/scale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const date = getChallengeDate();
    const challenge = await getOrCreateTodayScaleChallenge(date);

    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (!user) {
      return NextResponse.json({
        challengeId: challenge.id,
        date,
        game: null,
      });
    }

    const game = await getScaleGameProgress(user.id, challenge.id);
    const publicChallenge = await buildScaleChallengePublic(
      date,
      game?.rounds ?? [],
    );

    return NextResponse.json({
      challengeId: challenge.id,
      date,
      game,
      challenge: publicChallenge,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load scale progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
