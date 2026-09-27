import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserScaleStats } from "@/lib/db/scale";

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
    const stats = await getUserScaleStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[me/scale/stats] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
