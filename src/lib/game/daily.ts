import { createHash } from "crypto";
import type { Difficulty } from "./types";
import {
  challengeIdFromDate,
  getChallengeDate,
} from "./challenge-calendar";

export {
  CHALLENGE_TIMEZONE,
  EPOCH_DATE,
  addChallengeDays,
  challengeIdFromDate,
  getChallengeDate,
  parseDateOnly,
} from "./challenge-calendar";

const DIFFICULTY_CYCLE: Difficulty[] = [
  "EASY",
  "EASY",
  "NORMAL",
  "NORMAL",
  "NORMAL",
  "HARD",
  "EXPERT",
];

export function hashSeed(input: string): number {
  const digest = createHash("sha256").update(input).digest();
  return digest.readUInt32BE(0);
}

export function pickDailyPokemonId(
  date: string,
  pokemonIds: number[],
  secretSalt: string,
): number {
  if (pokemonIds.length === 0) {
    throw new Error("Pokemon pool is empty. Run pnpm sync:pokemon first.");
  }
  const seed = hashSeed(`${date}:${secretSalt}`);
  const index = seed % pokemonIds.length;
  return pokemonIds[index]!;
}

export function difficultyForDate(date: string): Difficulty {
  const id = challengeIdFromDate(date);
  return DIFFICULTY_CYCLE[(id - 1) % DIFFICULTY_CYCLE.length]!;
}

export function filterPoolByDifficulty(
  rows: { id: number; difficulty: Difficulty }[],
  target: Difficulty,
): number[] {
  const preferred = rows.filter((r) => r.difficulty === target).map((r) => r.id);
  if (preferred.length >= 20) return preferred;

  const fallbackOrder: Difficulty[] = ["EASY", "NORMAL", "HARD", "EXPERT"];
  const start = fallbackOrder.indexOf(target);
  const expanded = new Set(preferred);
  for (let i = 0; i < fallbackOrder.length; i++) {
    const d = fallbackOrder[(start + i) % fallbackOrder.length]!;
    for (const row of rows) {
      if (row.difficulty === d) expanded.add(row.id);
    }
    if (expanded.size >= 50) break;
  }
  return [...expanded];
}

export function assertNotFuture(date: string, today = getChallengeDate()): void {
  if (date > today) {
    throw new Error("Future challenges are not accessible.");
  }
}
