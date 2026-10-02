import { hintsUnlockedBeforeGuess } from "./hints";
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
  FAR: 1,
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
  /** Guess-count efficiency slice (42–100 when won, else 0). */
  efficiency: number;
  /** Clue-quality bonus from misses (0–12 win, 0–50 loss). */
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
 * Generation-only rounds (guesses 1–2) do not count against accuracy:
 * types / evolution / colors are still locked, and generation is already
 * constrained by search.
 *
 * Later misses (types hint onward) still blend best + average.
 * Winning before any extra hint unlocks credits most of the accuracy bonus.
 */
function informedClueQuality(results: GuessResult[]): number {
  if (results.length === 0) return 0;

  const judged: number[] = [];
  results.forEach((result, index) => {
    const hintCount = hintsUnlockedBeforeGuess(index + 1);
    if (hintCount <= 1) return;
    judged.push(guessQuality(result));
  });

  if (judged.length === 0) return 0.75;

  const avg = judged.reduce((sum, q) => sum + q, 0) / judged.length;
  const best = Math.max(...judged);
  return 0.5 * best + 0.5 * avg;
}

const WIN_ACCURACY_MAX = 12;
const LAST_GUESS_WIN_EFFICIENCY = 42;

/**
 * Almost all of a win score is how few guesses it took.
 * 6 guesses → 100, 88, 77, 65, 54, 42 so a 2-guess win is A even
 * if the first miss was a shot in the dark (types hint is still locked).
 */
function winEfficiency(guessCount: number, maxGuesses: number): number {
  if (guessCount <= 1) return 100;
  if (maxGuesses <= 1) return 100;
  const t = Math.min(guessCount, maxGuesses);
  return Math.round(
    100 -
      ((t - 1) / (maxGuesses - 1)) * (100 - LAST_GUESS_WIN_EFFICIENCY),
  );
}

/**
 * Score a finished run.
 *
 * Win: 42–100 from guess count + up to 12 from informed misses.
 * Guesses 1–2 (generation hint only) are not judged. A 2-guess win is ~97 S.
 * Loss: up to 50 from clue quality on rounds that had extra hints.
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
    const efficiency = winEfficiency(n, maxGuesses);
    const accuracy = Math.round(
      informedClueQuality(results.slice(0, -1)) * WIN_ACCURACY_MAX,
    );
    const score = Math.min(100, efficiency + accuracy);

    return {
      score,
      grade: letterGrade(score),
      efficiency,
      accuracy,
    };
  }

  const accuracy = Math.round(informedClueQuality(results) * 50);
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
