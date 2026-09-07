import type {
  AttributeResult,
  GuessAttributes,
  GuessResult,
  MatchStatus,
  PokemonRecord,
  TypeResult,
} from "./types";

export function compareAttribute(
  guess: number,
  target: number,
): AttributeResult {
  const difference = Math.abs(guess - target);
  const percentage = target === 0 ? (difference === 0 ? 0 : 1) : difference / target;

  let status: MatchStatus;
  if (guess === target) {
    status = "EXACT";
  } else if (percentage <= 0.1) {
    status = "VERY_CLOSE";
  } else if (percentage <= 0.25) {
    status = "CLOSE";
  } else {
    status = "FAR";
  }

  let direction: AttributeResult["direction"] = null;
  if (guess < target) direction = "UP";
  if (guess > target) direction = "DOWN";

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
    generation: compareAttribute(guess.generation, target.generation),
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
