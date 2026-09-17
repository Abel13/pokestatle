import type {
  AttributeResult,
  ColorResult,
  EvolutionResult,
  GuessAttributes,
  GuessResult,
  MatchStatus,
  PokemonRecord,
  TypeResult,
} from "./types";

type StatusThreshold = { max: number; status: MatchStatus };

const ABSOLUTE_THRESHOLDS: StatusThreshold[] = [
  { max: 1, status: "VERY_CLOSE" }, // Off by 1
  { max: 2, status: "CLOSE" },      // Off by 2
  { max: Infinity, status: "FAR" }, // Off by 3+
];

const PERCENTAGE_THRESHOLDS: StatusThreshold[] = [
  { max: 0.1, status: "VERY_CLOSE" },  // ≤10%
  { max: 0.25, status: "CLOSE" },      // ≤25%
  { max: Infinity, status: "FAR" },    // >25%
];

function getStatusFromThresholds(
  value: number,
  thresholds: StatusThreshold[],
): MatchStatus {
  return thresholds.find((t) => value <= t.max)!.status;
}

export function compareAttribute(
  guess: number,
  target: number,
  useAbsolute = false,
): AttributeResult {
  const difference = Math.abs(guess - target);

  const status: MatchStatus =
    guess === target
      ? "EXACT"
      : useAbsolute
        ? getStatusFromThresholds(difference, ABSOLUTE_THRESHOLDS)
        : getStatusFromThresholds(
            target === 0 ? (difference === 0 ? 0 : 1) : difference / target,
            PERCENTAGE_THRESHOLDS,
          );

  const direction: AttributeResult["direction"] =
    guess < target ? "UP" : guess > target ? "DOWN" : null;

  return { status, direction, guessValue: guess };
}

export function compareTypes(
  guessTypes: string[],
  targetTypes: string[],
): TypeResult[] {
  const targetSet = new Set(targetTypes.map((t) => t.toLowerCase()));
  return guessTypes.map((type) => ({
    type,
    match: targetSet.has(type.toLowerCase()),
  }));
}

export function compareEvolution(
  guess: PokemonRecord,
  target: PokemonRecord,
): EvolutionResult {
  return {
    stage: guess.evolutionStage,
    lineLength: guess.evolutionLineLength,
    match:
      guess.evolutionStage === target.evolutionStage &&
      guess.evolutionLineLength === target.evolutionLineLength,
  };
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(raw)) return null;
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

/** Quantized artwork colors sit on a 24-step grid; nearby buckets still count. */
const COLOR_MATCH_DISTANCE = 36;

function isColorClose(a: string, b: string): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const left = parseHex(a);
  const right = parseHex(b);
  if (!left || !right) return false;
  const dr = left.r - right.r;
  const dg = left.g - right.g;
  const db = left.b - right.b;
  return Math.sqrt(dr * dr + dg * dg + db * db) <= COLOR_MATCH_DISTANCE;
}

export function compareColors(
  guessPrimary: string | null,
  guessSecondary: string | null,
  targetPrimary: string | null,
  targetSecondary: string | null,
): ColorResult[] {
  const guess = [guessPrimary, guessSecondary].filter(
    (color, index, list): color is string =>
      Boolean(color) && list.indexOf(color) === index,
  );
  const target = [targetPrimary, targetSecondary].filter(
    (color): color is string => Boolean(color),
  );

  return guess.map((color) => ({
    color,
    match: target.some((candidate) => isColorClose(color, candidate)),
  }));
}

export function comparePokemon(
  guess: PokemonRecord,
  target: PokemonRecord,
): GuessResult {
  const attributes: GuessAttributes = {
    generation: compareAttribute(guess.generation, target.generation, true), // Use absolute for generation
    types: compareTypes(guess.types, target.types),
    evolution: compareEvolution(guess, target),
    colors: compareColors(
      guess.primaryColor,
      guess.secondaryColor,
      target.primaryColor,
      target.secondaryColor,
    ),
    height: compareAttribute(guess.height, target.height),
    weight: compareAttribute(guess.weight, target.weight),
    hp: compareAttribute(guess.hp, target.hp),
    attack: compareAttribute(guess.attack, target.attack),
    defense: compareAttribute(guess.defense, target.defense),
    specialAttack: compareAttribute(guess.specialAttack, target.specialAttack),
    specialDefense: compareAttribute(
      guess.specialDefense,
      target.specialDefense,
    ),
    speed: compareAttribute(guess.speed, target.speed),
  };

  return {
    pokemonId: guess.id,
    name: guess.name,
    sprite: guess.sprite,
    isCorrect: guess.id === target.id,
    attributes,
  };
}
