import { createHash } from "crypto";
import type { Difficulty } from "./types";

/** Challenge calendar uses America/Sao_Paulo so the daily reset matches Brazil. */
export const CHALLENGE_TIMEZONE = "America/Sao_Paulo";

/** Day 1 of PokéStatle numbering. */
export const EPOCH_DATE = "2026-01-01";

const DIFFICULTY_CYCLE: Difficulty[] = [
  "EASY",
  "EASY",
  "NORMAL",
  "NORMAL",
  "NORMAL",
  "HARD",
  "EXPERT",
];

export function getChallengeDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHALLENGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function challengeIdFromDate(date: string): number {
  const epoch = parseDateOnly(EPOCH_DATE).getTime();
  const current = parseDateOnly(date).getTime();
  const days = Math.floor((current - epoch) / 86_400_000) + 1;
  return Math.max(1, days);
}

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
