"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Frown, PartyPopper } from "lucide-react";
import { useState } from "react";
import { ShareResultButton } from "@/components/game/share-result-button";
import { StatusLegend } from "@/components/game/status-legend";
import { calculateResultScore } from "@/lib/game/score";
import { formatShareText, formatShareUrl } from "@/lib/game/share";
import type { GuessResult } from "@/lib/game/types";
import { MAX_GUESSES } from "@/lib/game/types";

export function ResultScreen({
  won,
  challengeId,
  results,
  revealed,
}: {
  won: boolean;
  challengeId: number;
  results: GuessResult[];
  revealed?: { id: number; name: string; sprite: string };
}) {
  const [imageError, setImageError] = useState(false);
  const siteUrl =
    typeof window !== "undefined"
      ? formatShareUrl(window.location.origin)
      : "";
  const share = formatShareText(
    challengeId,
    results,
    won,
    MAX_GUESSES,
    siteUrl,
  );
  const resultScore = calculateResultScore(results, won, MAX_GUESSES);

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-background px-4 py-6 text-center sm:px-6">
      <div className="space-y-1">
        <h2 className="font-heading flex items-center justify-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {won ? (
            <>
              <PartyPopper className="size-5 text-teal-600 dark:text-teal-300" />
              You caught it
            </>
          ) : (
            <>
              <Frown className="size-5 text-muted-foreground" />
              Out of guesses
            </>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {won
            ? `Solved in ${results.length}/${MAX_GUESSES}.`
            : "Better luck tomorrow — same Pokémon for everyone."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-0.5">
          <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums text-teal-700 dark:text-teal-300">
            {resultScore.score}
            <span className="text-xl font-medium text-muted-foreground">
              /100
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Grade{" "}
            <span className="font-semibold text-foreground">
              {resultScore.grade}
            </span>
            {won ? (
              <span>
                {" "}
                · efficiency {resultScore.efficiency} · accuracy{" "}
                {resultScore.accuracy}
              </span>
            ) : (
              <span> · clue quality {resultScore.accuracy}</span>
            )}
          </p>
        </div>

        {revealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            {revealed.sprite && !imageError ? (
              <Image
                src={revealed.sprite}
                alt={revealed.name}
                width={128}
                height={128}
                className="size-28 object-contain sm:size-32"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-2xl bg-muted/70 text-4xl font-semibold text-muted-foreground sm:size-32">
                ?
              </div>
            )}
            <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {revealed.name}
            </p>
          </motion.div>
        ) : null}

        <pre className="w-fit max-w-full overflow-x-auto rounded-xl bg-muted/70 px-4 py-3 text-center font-mono text-[13px] leading-5 whitespace-pre sm:text-sm sm:leading-6">
          {share}
        </pre>

        <StatusLegend className="max-w-[20rem] sm:max-w-none" />
      </div>

      <ShareResultButton
        text={share}
        title="Pokéstatle: Guess them"
        challengeId={challengeId}
      />
    </div>
  );
}
