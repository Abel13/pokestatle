import "dotenv/config";
import { getOrCreateTodayChallenge, getPoolSize } from "../src/lib/db/queries";
import { getChallengeDate } from "../src/lib/game/daily";

(async () => {
  const date = getChallengeDate();
  const challenge = await getOrCreateTodayChallenge(date);
  console.log(
    JSON.stringify(
      {
        id: challenge.id,
        date: challenge.date,
        difficulty: challenge.difficulty,
        pokemonPoolSize: await getPoolSize(),
      },
      null,
      2,
    ),
  );
})();
