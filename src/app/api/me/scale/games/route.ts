import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listUserScaleGames } from "@/lib/db/scale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ games: [] });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ games: [] });
    }
    const games = await listUserScaleGames(user.id);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("[me/scale/games] Error:", error);
    return NextResponse.json({ games: [] });
  }
}
