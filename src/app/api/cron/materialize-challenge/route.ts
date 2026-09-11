import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { createDailyChallenge, getChallenge, getPoolSize } from "@/lib/db/queries";
import { addChallengeDays, getChallengeDate } from "@/lib/game/daily";
import { todayChallengeCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MaterializeResult = {
  date: string;
  challengeId: number;
  action: "existing" | "created";
};

/**
 * Ensure a challenge row exists for the given date and warm local cache.
 */
async function materializeDate(
  date: string,
  pokemonPoolSize: number,
): Promise<MaterializeResult> {
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

    return {
      date,
      challengeId: existing.id,
      action: "existing",
    };
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

  console.log(
    `[cron] Successfully created challenge for ${date} (id: ${challenge.id})`,
  );

  return {
    date,
    challengeId: challenge.id,
    action: "created",
  };
}

/**
 * Vercel Cron endpoint to materialize today's and tomorrow's challenges.
 * Schedule in vercel.json: `0 3 * * *` = 03:00 UTC = 00:00 America/Sao_Paulo.
 * Pre-creating tomorrow removes the midnight race where the new day has no row yet.
 *
 * Vercel automatically passes an Authorization header with the cron secret.
 */
export async function GET() {
  try {
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

    const today = getChallengeDate();
    const tomorrow = addChallengeDays(today, 1);
    const pokemonPoolSize = await getPoolSize();

    const results = [
      await materializeDate(today, pokemonPoolSize),
      await materializeDate(tomorrow, pokemonPoolSize),
    ];

    revalidateTag("challenge-today", "max");
    revalidateTag("challenge-by-date", "max");

    return NextResponse.json({
      success: true,
      results,
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
