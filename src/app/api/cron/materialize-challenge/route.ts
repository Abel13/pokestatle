import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createDailyChallenge, getChallenge } from "@/lib/db/queries";
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
export async function GET(request: Request) {
  try {
    // Validate request is from Vercel Cron
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    // Check if running on Vercel with cron secret
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("[cron] Unauthorized attempt to trigger cron job");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      // In development, allow without auth but log a warning
      console.warn("[cron] CRON_SECRET not set - running in development mode");
    }
    
    const date = getChallengeDate();
    
    // Check if challenge already exists
    const existing = await getChallenge(date);
    if (existing) {
      console.log(`[cron] Challenge for ${date} already exists (id: ${existing.id})`);
      
      // Warm the cache
      todayChallengeCache.set(date, existing, 60 * 60 * 1000); // 1 hour
      
      return NextResponse.json({
        success: true,
        date,
        challengeId: existing.id,
        action: "existing",
      });
    }
    
    // Create today's challenge
    console.log(`[cron] Creating challenge for ${date}...`);
    const challenge = await createDailyChallenge(date);
    
    // Warm the cache
    todayChallengeCache.set(date, challenge, 60 * 60 * 1000); // 1 hour
    
    console.log(`[cron] Successfully created challenge for ${date} (id: ${challenge.id})`);
    
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
      { status: 500 }
    );
  }
}
