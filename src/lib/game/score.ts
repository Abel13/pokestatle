import type {
  AttributeResult,
  GuessAttributes,
  GuessResult,
  MatchStatus,
} from "./types";
import { MAX_GUESSES } from "./types";

const STATUS_POINTS: Record<MatchStatus, number> = {
  EXACT: 4,
  VERY_CLOSE: 3,
  CLOSE: 2,
  FAR: 0,
};

/** Points available per guess (10 attributes × 4). */
const MAX_GUESS_POINTS = 40;

function attributePoints(result: AttributeResult): number {
  return STATUS_POINTS[result.status];
}

function typesPoints(types: GuessAttributes["types"]): number {
  if (types.length === 0) return 0;
  if (types.every((t) => t.match)) return 4;
  if (types.some((t) => t.match)) return 2;
  return 0;
}

/** 0–1 quality of a single guess from attribute proximity. */
export function guessQuality(result: GuessResult): number {
  const a = result.attributes;
  const points =
    attributePoints(a.generation) +
    typesPoints(a.types) +
    attributePoints(a.height) +
    attributePoints(a.weight) +
    attributePoints(a.hp) +
    attributePoints(a.attack) +
    attributePoints(a.defense) +
    attributePoints(a.specialAttack) +
    attributePoints(a.specialDefense) +
    attributePoints(a.speed);

  return points / MAX_GUESS_POINTS;
}

export type ResultScore = {
  /** Final grade from 0–100. */
  score: number;
  /** Letter band for display. */
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  /** Guess-count efficiency slice (0–70 when won, else 0). */
  efficiency: number;
  /** Clue-quality slice from guesses (0–30 win, 0–40 loss). */
  accuracy: number;
};

function letterGrade(score: number): ResultScore["grade"] {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

/**
 * Score a finished run.
 *
 * Win: up to 70 from solving early + up to 30 from how close earlier guesses were.
 * First-try win is always 100.
 * Loss: up to 40 from average clue quality across all guesses.
 */
export function calculateResultScore(
  results: GuessResult[],
  won: boolean,
  maxGuesses: number = MAX_GUESSES,
): ResultScore {
  if (results.length === 0) {
    return { score: 0, grade: "F", efficiency: 0, accuracy: 0 };
  }

  if (won) {
    const n = results.length;
    if (n === 1) {
      return { score: 100, grade: "S", efficiency: 70, accuracy: 30 };
    }

    const efficiency = Math.round(((maxGuesses - n + 1) / maxGuesses) * 70);
    const prior = results.slice(0, -1);
    const avgQuality =
      prior.reduce((sum, r) => sum + guessQuality(r), 0) / prior.length;
    const accuracy = Math.round(avgQuality * 30);
    const score = Math.min(100, efficiency + accuracy);

    return {
      score,
      grade: letterGrade(score),
      efficiency,
      accuracy,
    };
  }

  const avgQuality =
    results.reduce((sum, r) => sum + guessQuality(r), 0) / results.length;
  const accuracy = Math.round(avgQuality * 40);
  const score = accuracy;

  return {
    score,
    grade: letterGrade(score),
    efficiency: 0,
    accuracy,
  };
}

export function formatScoreLine(result: ResultScore): string {
  return `${result.score}/100 · ${result.grade}`;
}
