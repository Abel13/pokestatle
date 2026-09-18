"use client";

import { sendGAEvent } from "@next/third-parties/google";

const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;

function track(
  name: string,
  params: Record<string, string | number | boolean>,
) {
  if (!gaMeasurementId) return;
  sendGAEvent("event", name, params);
}

export function trackGuess(params: {
  guessNumber: number;
  pokemonName: string;
  isCorrect: boolean;
  challengeDate: string;
}) {
  track("guess", {
    guess_number: params.guessNumber,
    pokemon_name: params.pokemonName,
    is_correct: params.isCorrect,
    challenge_date: params.challengeDate,
  });
}

export function trackGameComplete(params: {
  won: boolean;
  guessCount: number;
  score: number;
  challengeId: number;
}) {
  track("game_complete", {
    outcome: params.won ? "won" : "lost",
    guess_count: params.guessCount,
    score: params.score,
    challenge_id: params.challengeId,
  });
}

export function trackShare(params: {
  method: "native" | "clipboard";
  challengeId: number;
}) {
  track("share", {
    method: params.method,
    challenge_id: params.challengeId,
  });
}
