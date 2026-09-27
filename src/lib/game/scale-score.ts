import type { ScalePair } from "./scale-types";

/** PokéAPI height is in decimeters; display as meters. */
export function heightDmToMeters(dm: number): number {
  return dm / 10;
}

export function formatHeightMeters(dm: number): string {
  const m = heightDmToMeters(dm);
  return `${m.toFixed(m >= 10 ? 1 : 2)} m`;
}

/**
 * Relative height error → 0–100.
 * 0% error = 100; ≥50% error = 0.
 */
export function scoreScaleGuess(
  guessHeightDm: number,
  realHeightDm: number,
): number {
  if (!Number.isFinite(guessHeightDm) || guessHeightDm <= 0) return 0;
  if (!Number.isFinite(realHeightDm) || realHeightDm <= 0) return 0;
  const error = Math.abs(guessHeightDm - realHeightDm) / realHeightDm;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - error / 0.5))));
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
  challengeId: number;
  scores: number[];
  totalScore: number;
  siteUrl?: string;
}): string {
  const bars = input.scores
    .map((s) => {
      if (s >= 90) return "🟩";
      if (s >= 70) return "🟨";
      if (s >= 40) return "🟧";
      return "⬛";
    })
    .join("");
  const grade = letterGradeScale(input.totalScore);
  const parts = [
    `PokéSize #${input.challengeId}`,
    bars,
    `${input.totalScore}/500 · ${grade}`,
  ];
  if (input.siteUrl) {
    parts.push("", input.siteUrl);
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
