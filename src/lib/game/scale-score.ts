import type { ScalePair } from "./scale-types";

/** PokéAPI height is in decimeters; display as meters. */
export function heightDmToMeters(dm: number): number {
  return dm / 10;
}

export function formatHeightMeters(dm: number): string {
  const m = heightDmToMeters(dm);
  // Show cm precision (0.01 m) for resize guesses.
  return `${m.toFixed(2)} m`;
}

const PERFECT_SCORE_TOLERANCE = 0.05;

/**
 * Relative height error → 0–100 with exponential decay (k = 2).
 * Guesses within 5% of the real height count as perfect, so near misses are
 * not penalized. Beyond that margin, the score decays smoothly without a hard
 * cliff.
 */
export function scoreScaleGuess(
  guessHeightDm: number,
  realHeightDm: number,
): number {
  if (!Number.isFinite(guessHeightDm) || guessHeightDm <= 0) return 0;
  if (!Number.isFinite(realHeightDm) || realHeightDm <= 0) return 0;
  const error = Math.abs(guessHeightDm - realHeightDm) / realHeightDm;
  const penalizedError = Math.max(0, error - PERFECT_SCORE_TOLERANCE);
  return Math.max(
    0,
    Math.min(100, Math.round(100 * Math.exp(-2 * penalizedError))),
  );
}

export function letterGradeScale(totalScore: number): string {
  const avg = totalScore / 5;
  if (avg >= 95) return "S";
  if (avg >= 85) return "A";
  if (avg >= 70) return "B";
  if (avg >= 55) return "C";
  if (avg >= 40) return "D";
  return "F";
}

export function formatScaleShareText(input: {
  scores: number[];
  totalScore: number;
  siteUrl?: string;
}): string {
  const lines = input.scores.map((score) => {
    const filled = Math.max(0, Math.min(5, Math.round(score / 20)));
    const bar = "🟩".repeat(filled) + "⬜".repeat(5 - filled);
    return `${bar} ${score}`;
  });
  const parts = [
    "Pokéstatle: Resize them",
    `Overall Score ${input.totalScore}`,
    "",
    ...lines,
  ];
  if (input.siteUrl) {
    parts.push(input.siteUrl);
  }
  return parts.join("\n");
}

/** @internal exported for tests / pair validation */
export function pairHeightRatio(a: number, b: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (lo <= 0) return Number.POSITIVE_INFINITY;
  return hi / lo;
}

export function isPlayablePair(aHeight: number, bHeight: number): boolean {
  const ratio = pairHeightRatio(aHeight, bHeight);
  return ratio >= 1.05 && ratio <= 40;
}

/** First of the shuffled pair is reference; second is the resizable target. */
export function assignReferenceTarget(
  a: { id: number; height: number },
  b: { id: number; height: number },
): ScalePair {
  return { referenceId: a.id, targetId: b.id };
}
