/**
 * Script to backfill missing daily challenges
 * Creates challenges for all dates from epoch to today
 */

import { createDailyChallenge, getChallenge } from "../src/lib/db/queries";
import { getChallengeDate, EPOCH_DATE } from "../src/lib/game/daily";

function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function backfillChallenges() {
  const today = getChallengeDate();
  const start = parseDateOnly(EPOCH_DATE);
  const end = parseDateOnly(today);
  
  console.log(`Backfilling challenges from ${EPOCH_DATE} to ${today}...`);
  
  let created = 0;
  let existing = 0;
  let errors = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const date = formatDate(current);
    
    try {
      // Check if exists
      const exists = await getChallenge(date);
      
      if (exists) {
        existing++;
        console.log(`✓ ${date} - Already exists (ID: ${exists.id})`);
      } else {
        // Create it
        const challenge = await createDailyChallenge(date);
        created++;
        console.log(`✓ ${date} - Created (ID: ${challenge.id})`);
      }
    } catch (error) {
      errors++;
      console.error(`✗ ${date} - Error:`, error instanceof Error ? error.message : error);
    }
    
    // Move to next day
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  console.log("\n=== Summary ===");
  console.log(`Created: ${created}`);
  console.log(`Already existed: ${existing}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${created + existing + errors}`);
}

backfillChallenges()
  .then(() => {
    console.log("\n✅ Backfill complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Backfill failed:", error);
    process.exit(1);
  });
