import type {
  AttributeResult,
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

export function comparePokemon(
  guess: PokemonRecord,
  target: PokemonRecord,
): GuessResult {
  const attributes: GuessAttributes = {
    generation: compareAttribute(guess.generation, target.generation, true), // Use absolute for generation
    types: compareTypes(guess.types, target.types),
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
