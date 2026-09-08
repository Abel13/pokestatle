"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Copy, Frown, PartyPopper, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateResultScore } from "@/lib/game/score";
import { formatShareText } from "@/lib/game/share";
import type { GuessResult } from "@/lib/game/types";
import { MAX_GUESSES } from "@/lib/game/types";

export function ResultModal({
  open,
  onOpenChange,
  won,
  challengeId,
  results,
  revealed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  won: boolean;
  challengeId: number;
  results: GuessResult[];
  revealed?: { id: number; name: string; sprite: string };
}) {
  const [copied, setCopied] = useState(false);
  const share = formatShareText(challengeId, results, won, MAX_GUESSES);
  const resultScore = calculateResultScore(results, won, MAX_GUESSES);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(share);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function onShare() {
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;

    if (isMobile && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `PokéStatle #${challengeId}`,
          text: share,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    await copyToClipboard();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          "!fixed !inset-0 !top-0 !left-0 z-50 flex !h-dvh !max-h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none border-0 p-0 text-center " +
          "sm:!inset-auto sm:!top-1/2 sm:!left-1/2 sm:!h-auto sm:!max-h-[90vh] sm:!w-full sm:!max-w-md sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-xl sm:border"
        }
      >
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
          <DialogHeader className="shrink-0 items-center gap-1 pr-8 text-center sm:pr-0">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
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
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm">
              {won
                ? `Solved in ${results.length}/${MAX_GUESSES}.`
                : "Better luck tomorrow — same Pokémon for everyone."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-3">
            <div className="flex flex-col items-center gap-0.5">
              <p className="font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {resultScore.score}
                <span className="text-lg font-medium text-muted-foreground sm:text-xl">
                  /100
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Grade{" "}
                <span className="font-semibold text-foreground">
                  {resultScore.grade}
                </span>
                {won ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · efficiency {resultScore.efficiency} · accuracy{" "}
                    {resultScore.accuracy}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {" "}
                    · clue quality {resultScore.accuracy}
                  </span>
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
                {revealed.sprite ? (
                  <Image
                    src={revealed.sprite}
                    alt={revealed.name}
                    width={128}
                    height={128}
                    className="size-28 object-contain sm:size-32"
                    unoptimized
                  />
                ) : null}
                <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  {revealed.name}
                </p>
              </motion.div>
            ) : null}

            <pre className="w-fit max-w-full overflow-x-auto rounded-xl bg-muted/70 px-4 py-3 text-center font-mono text-[13px] leading-5 whitespace-pre sm:text-sm sm:leading-6">
              {share}
            </pre>

            <p className="max-w-[20rem] text-[11px] leading-snug text-muted-foreground sm:max-w-none sm:text-xs">
              Close → color: 🟩 exact · 🟨 ≤10% · 🟧 ≤25%
              <br />
              Far → direction: ⬆️ higher · ⬇️ lower · ⬛ types miss
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full shrink-0 sm:h-10"
            onClick={onShare}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <>
                <Share2 className="size-4 sm:hidden" />
                <Copy className="hidden size-4 sm:block" />
              </>
            )}
            {copied ? (
              <span>Copied</span>
            ) : (
              <>
                <span className="sm:hidden">Share</span>
                <span className="hidden sm:inline">Copy Result</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
