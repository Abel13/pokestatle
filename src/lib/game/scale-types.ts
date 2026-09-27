export const SCALE_ROUNDS = 5;
export const SCALE_POKEMON_COUNT = 10;
export const MAX_SCALE_TOTAL = 500;

export type ScalePair = {
  referenceId: number;
  targetId: number;
};

export type ScaleGameStatus = "PLAYING" | "COMPLETE";

export type ScaleRoundResult = {
  roundIndex: number;
  guessHeightDm: number;
  realHeightDm: number;
  score: number;
  confirmedAt: string;
};

export type ScaleGameState = {
  challengeId: number;
  date: string;
  rounds: ScaleRoundResult[];
  totalScore: number;
  status: ScaleGameStatus;
  completedAt?: string;
};

export type ScalePokemonPublic = {
  id: number;
  name: string;
  sprite: string;
};

export type ScaleRoundPublic = {
  roundIndex: number;
  reference: ScalePokemonPublic & { heightDm: number };
  target: ScalePokemonPublic;
  /** Present after the round is confirmed */
  targetHeightDm?: number;
  result?: ScaleRoundResult;
};

export type ScaleChallengePublic = {
  challengeId: number;
  date: string;
  rounds: ScaleRoundPublic[];
};
