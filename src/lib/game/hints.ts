import type { GameStatus, PokemonRecord } from "@/lib/game/types";

/** Guesses already made required to unlock each hint (start of that round). */
export const HINT_UNLOCK_AT = {
  generation: 0,
  types: 2,
  evolution: 4,
  colors: 5,
} as const;

export type HintKind = keyof typeof HINT_UNLOCK_AT;

export const GENERATION_META: Record<
  number,
  { roman: string; region: string }
> = {
  1: { roman: "I", region: "Kanto" },
  2: { roman: "II", region: "Johto" },
  3: { roman: "III", region: "Hoenn" },
  4: { roman: "IV", region: "Sinnoh" },
  5: { roman: "V", region: "Unova" },
  6: { roman: "VI", region: "Kalos" },
  7: { roman: "VII", region: "Alola" },
  8: { roman: "VIII", region: "Galar" },
  9: { roman: "IX", region: "Paldea" },
};

export function generationMeta(generation: number): {
  roman: string;
  region: string;
} {
  return (
    GENERATION_META[generation] ?? {
      roman: String(generation),
      region: "Unknown",
    }
  );
}

export function evolutionHintLabel(stage: number, lineLength: number): string {
  if (lineLength <= 1) return "Does not evolve";
  const pos = `${stage} of ${lineLength}`;
  if (stage <= 1) return `First form · ${pos}`;
  if (stage >= lineLength) return `Final form · ${pos}`;
  return `Middle form · ${pos}`;
}

/**
 * Unlock counter: a win does not reveal hints for rounds that never started.
 * A loss after 6 guesses keeps every hint that unlocked on rounds 1–6.
 */
export function hintUnlockCount(
  guessesMade: number,
  status: GameStatus = "PLAYING",
): number {
  if (status === "WON") return Math.max(0, guessesMade - 1);
  return guessesMade;
}

export function isHintUnlocked(kind: HintKind, unlockCount: number): boolean {
  return unlockCount >= HINT_UNLOCK_AT[kind];
}

export interface GenerationHint {
  generation: number;
  roman: string;
  region: string;
}

export interface EvolutionHint {
  hasEvolution: boolean;
  stage: number;
  lineLength: number;
  label: string;
}

export interface ColorHint {
  primary: string;
  secondary: string;
}

export interface ChallengeHints {
  generation?: GenerationHint;
  types?: string[];
  evolution?: EvolutionHint;
  colors?: ColorHint;
}

const TYPE_COLOR_FALLBACK: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

function colorHintFor(pokemon: PokemonRecord): ColorHint | undefined {
  if (pokemon.primaryColor && pokemon.secondaryColor) {
    return {
      primary: pokemon.primaryColor,
      secondary: pokemon.secondaryColor,
    };
  }
  const t0 = pokemon.types[0]?.toLowerCase();
  const t1 = pokemon.types[1]?.toLowerCase() ?? t0;
  if (!t0) return undefined;
  return {
    primary: TYPE_COLOR_FALLBACK[t0] ?? "#14b8a6",
    secondary: TYPE_COLOR_FALLBACK[t1 ?? ""] ?? "#0f766e",
  };
}

export function buildChallengeHints(
  pokemon: PokemonRecord,
  unlockCount: number,
): ChallengeHints {
  const hints: ChallengeHints = {};

  if (isHintUnlocked("generation", unlockCount)) {
    const meta = generationMeta(pokemon.generation);
    hints.generation = {
      generation: pokemon.generation,
      roman: meta.roman,
      region: meta.region,
    };
  }

  if (isHintUnlocked("types", unlockCount)) {
    hints.types = [...pokemon.types];
  }

  if (isHintUnlocked("evolution", unlockCount)) {
    const stage = pokemon.evolutionStage;
    const lineLength = pokemon.evolutionLineLength;
    hints.evolution = {
      hasEvolution: lineLength > 1,
      stage,
      lineLength,
      label: evolutionHintLabel(stage, lineLength),
    };
  }

  if (isHintUnlocked("colors", unlockCount)) {
    const colors = colorHintFor(pokemon);
    if (colors) hints.colors = colors;
  }

  return hints;
}

export function unlockedHintKeys(hints: ChallengeHints): HintKind[] {
  const keys: HintKind[] = [];
  if (hints.generation) keys.push("generation");
  if (hints.types) keys.push("types");
  if (hints.evolution) keys.push("evolution");
  if (hints.colors) keys.push("colors");
  return keys;
}
