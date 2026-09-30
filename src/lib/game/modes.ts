/** Daily game modes under PokéStatle. */
export type GameMode = "guess" | "resize";

export const GAME_MODES: {
  id: GameMode;
  label: string;
  shortLabel: string;
  tagline: string;
  playPath: string;
}[] = [
  {
    id: "guess",
    label: "Guess them",
    shortLabel: "Guess",
    tagline: "Attribute clues in six guesses",
    playPath: "/",
  },
  {
    id: "resize",
    label: "Resize them",
    shortLabel: "Resize",
    tagline: "Compare heights across five pairs",
    playPath: "/resize-them",
  },
];

export function gameModeLabel(mode: GameMode): string {
  return GAME_MODES.find((m) => m.id === mode)?.label ?? mode;
}

export function gameModePlayPath(mode: GameMode): string {
  return GAME_MODES.find((m) => m.id === mode)?.playPath ?? "/";
}

const MODE_STORAGE_KEY = "pokestatle:game-mode";

export function loadPreferredGameMode(): GameMode {
  if (typeof window === "undefined") return "guess";
  try {
    const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (raw === "resize" || raw === "guess") return raw;
  } catch {
    // ignore
  }
  return "guess";
}

export function savePreferredGameMode(mode: GameMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

/** Share URL for Resize them (today’s play page, no date). */
export function formatResizeShareUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/resize-them`;
}

/** Share URL for Guess them (today’s play page, no date). */
export function formatGuessShareUrl(origin: string): string {
  return origin.replace(/\/$/, "");
}
