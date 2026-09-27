import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listUserScaleGames } from "@/lib/db/scale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Auth unavailable" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const games = await listUserScaleGames(user.id);
    const items = games
      .filter((g) => g.status === "COMPLETE")
      .sort((a, b) => b.challengeId - a.challengeId)
      .slice(0, 40)
      .map((g) => ({
        challengeId: g.challengeId,
        date: g.date,
        status: g.status,
        totalScore: g.totalScore,
        rounds: g.rounds.length,
        completedAt: g.completedAt,
      }));
    return NextResponse.json(items);
  } catch (error) {
    console.error("[me/scale/history] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
