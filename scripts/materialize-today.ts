/**
 * Materializes today's daily challenge (and optionally refuses tomorrow).
 * Safe to run from cron: `0 0 * * * pnpm challenge:today`
 */
import "dotenv/config";
import { getOrCreateTodayChallenge, getPoolSize } from "../src/lib/db/queries";
import { getChallengeDate } from "../src/lib/game/daily";

const date = getChallengeDate();
const challenge = getOrCreateTodayChallenge(date);
console.log(
  JSON.stringify(
    {
      id: challenge.id,
      date: challenge.date,
      difficulty: challenge.difficulty,
      pokemonPoolSize: getPoolSize(),
      // pokemon_id intentionally omitted from logs in production usage
    },
    null,
    2,
  ),
);
