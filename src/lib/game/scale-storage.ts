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
