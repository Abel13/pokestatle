export type MatchStatus = "EXACT" | "VERY_CLOSE" | "CLOSE" | "FAR";
export type Direction = "UP" | "DOWN" | null;
export type GameStatus = "PLAYING" | "WON" | "LOST";
export type Difficulty = "EASY" | "NORMAL" | "HARD" | "EXPERT";

export interface AttributeResult {
  status: MatchStatus;
  direction: Direction;
  guessValue: number;
}

export interface TypeResult {
  type: string;
  match: boolean;
}

export interface PokemonRecord {
  id: number;
  name: string;
  slug: string;
  generation: number;
  height: number;
  weight: number;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  baseStatTotal: number;
  isLegendary: boolean;
  isMythical: boolean;
  evolvesFrom: number | null;
  evolutionStage: number;
  sprite: string;
  difficulty: Difficulty;
  types: string[];
}

export interface GuessAttributes {
  generation: AttributeResult;
  types: TypeResult[];
  height: AttributeResult;
  weight: AttributeResult;
  hp: AttributeResult;
  attack: AttributeResult;
  defense: AttributeResult;
  specialAttack: AttributeResult;
  specialDefense: AttributeResult;
  speed: AttributeResult;
}

export interface GuessResult {
  pokemonId: number;
  name: string;
  sprite: string;
  isCorrect: boolean;
  attributes: GuessAttributes;
}

export interface GameState {
  challengeId: number;
  date: string;
  guesses: number[];
  results: GuessResult[];
  status: GameStatus;
  completedAt?: string;
  revealedPokemon?: {
    id: number;
    name: string;
    sprite: string;
  };
}

export const MAX_GUESSES = 6;
export const STORAGE_PREFIX = "pokestatle:";
