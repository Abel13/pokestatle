import type { GameState } from "@/lib/game/types";
import { STORAGE_PREFIX } from "@/lib/game/types";

export function storageKey(date: string) {
  return `${STORAGE_PREFIX}${date}`;
}

export function loadGameState(date: string): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(state.date), JSON.stringify(state));
}

export type LocalStats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  lastChallengeId: number | null;
};

const STATS_KEY = "pokestatle:stats";

export function loadLocalStats(): LocalStats {
  if (typeof window === "undefined") {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
      lastChallengeId: null,
    };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return {
        played: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0],
        lastChallengeId: null,
      };
    }
    return JSON.parse(raw) as LocalStats;
  } catch {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
      lastChallengeId: null,
    };
  }
}

export function updateLocalStatsOnComplete(input: {
  challengeId: number;
  won: boolean;
  guessCount: number;
}) {
  const stats = loadLocalStats();
  if (stats.lastChallengeId === input.challengeId) {
    return stats;
  }

  stats.played += 1;
  if (input.won) {
    stats.wins += 1;
    if (stats.lastChallengeId && input.challengeId === stats.lastChallengeId + 1) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    if (input.guessCount >= 1 && input.guessCount <= 6) {
      stats.distribution[input.guessCount - 1] =
        (stats.distribution[input.guessCount - 1] ?? 0) + 1;
    }
  } else {
    stats.currentStreak = 0;
  }
  stats.lastChallengeId = input.challengeId;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}
