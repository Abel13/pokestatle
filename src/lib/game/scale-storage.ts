import type { ScaleGameState } from "@/lib/game/scale-types";
import { STORAGE_PREFIX } from "@/lib/game/types";

const SCALE_PREFIX = `${STORAGE_PREFIX}scale:`;

export function scaleStorageKey(date: string) {
  return `${SCALE_PREFIX}${date}`;
}

export function loadScaleGameState(date: string): ScaleGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(scaleStorageKey(date));
    if (!raw) return null;
    return JSON.parse(raw) as ScaleGameState;
  } catch {
    return null;
  }
}

export function saveScaleGameState(state: ScaleGameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(scaleStorageKey(state.date), JSON.stringify(state));
}

/** Guest completed scale games from localStorage. */
export function listLocalScaleGames(): ScaleGameState[] {
  if (typeof window === "undefined") return [];
  const out: ScaleGameState[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(SCALE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as ScaleGameState;
      if (parsed?.status === "COMPLETE") out.push(parsed);
    }
  } catch {
    return out;
  }
  return out.sort((a, b) => b.challengeId - a.challengeId);
}
