import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createDailyChallenge, getChallenge } from "@/lib/db/queries";
import { getChallengeDate, EPOCH_DATE } from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for backfill

function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Backfill all missing challenges from EPOCH_DATE to today
 * Can be called manually or via cron
 */
export async function GET(request: Request) {
  try {
    // Optional: Validate with CRON_SECRET if set
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn("[backfill] Unauthorized attempt");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
    
    const today = getChallengeDate();
    const start = parseDateOnly(EPOCH_DATE);
    const end = parseDateOnly(today);
    
    console.log(`[backfill] Starting from ${EPOCH_DATE} to ${today}...`);
    
    let created = 0;
    let existing = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    
    const current = new Date(start);
    while (current <= end) {
      const date = formatDate(current);
      
      try {
        const exists = await getChallenge(date);
        
        if (exists) {
          existing++;
        } else {
          await createDailyChallenge(date);
          created++;
          
          if (created % 50 === 0) {
            console.log(`[backfill] Created ${created} challenges...`);
          }
        }
      } catch (error) {
        errors++;
        const msg = error instanceof Error ? error.message : String(error);
        errorDetails.push(`${date}: ${msg}`);
        console.error(`[backfill] Error on ${date}:`, error);
      }
      
      current.setUTCDate(current.getUTCDate() + 1);
    }
    
    console.log("[backfill] Complete!", { created, existing, errors });
    
    return NextResponse.json({
      success: true,
      summary: {
        created,
        existing,
        errors,
        total: created + existing + errors,
      },
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });
  } catch (error) {
    console.error("[backfill] Fatal error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: message,
        success: false,
      },
      { status: 500 }
    );
  }
}
