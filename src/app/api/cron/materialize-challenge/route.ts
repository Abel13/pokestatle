import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { createDailyChallenge, getChallenge, getPoolSize } from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";
import { todayChallengeCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron endpoint to materialize today's challenge
 * Runs daily at 3 AM BRT (6 AM UTC) to ensure challenge is ready
 *
 * Vercel automatically passes an Authorization header with the cron secret
 */
export async function GET() {
  try {
    // Validate request is from Vercel Cron
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("[cron] Unauthorized attempt to trigger cron job");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[cron] CRON_SECRET not set - running in development mode");
    }

    const date = getChallengeDate();
    const pokemonPoolSize = await getPoolSize();

    const existing = await getChallenge(date);
    if (existing) {
      console.log(
        `[cron] Challenge for ${date} already exists (id: ${existing.id})`,
      );

      todayChallengeCache.set(
        date,
        {
          id: existing.id,
          date: existing.date,
          difficulty: existing.difficulty,
          pokemonPoolSize,
          pokemonId: existing.pokemonId,
        },
        60 * 60 * 1000,
      );

      revalidateTag("challenge-today", "max");

      return NextResponse.json({
        success: true,
        date,
        challengeId: existing.id,
        action: "existing",
      });
    }

    console.log(`[cron] Creating challenge for ${date}...`);
    const challenge = await createDailyChallenge(date);

    todayChallengeCache.set(
      date,
      {
        id: challenge.id,
        date: challenge.date,
        difficulty: challenge.difficulty,
        pokemonPoolSize,
        pokemonId: challenge.pokemonId,
      },
      60 * 60 * 1000,
    );

    revalidateTag("challenge-today", "max");

    console.log(
      `[cron] Successfully created challenge for ${date} (id: ${challenge.id})`,
    );

    return NextResponse.json({
      success: true,
      date,
      challengeId: challenge.id,
      action: "created",
    });
  } catch (error) {
    console.error("[cron] Error materializing challenge:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
        date: getChallengeDate(),
      },
      { status: 500 },
    );
  }
}
