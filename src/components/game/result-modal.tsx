"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Copy, PartyPopper, Share2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          "fixed inset-0 top-0 left-0 z-50 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 overflow-y-auto rounded-none p-5 " +
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-4"
        }
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {won ? (
              <>
                <PartyPopper className="size-5 text-teal-600 dark:text-teal-300" />
                You caught it
              </>
            ) : (
              <>
                <X className="size-5" />
                Out of guesses
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {won
              ? `Solved in ${results.length}/${MAX_GUESSES}.`
              : "Better luck tomorrow — same Pokémon for everyone."}
          </DialogDescription>
        </DialogHeader>

        {revealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center gap-2 py-4 sm:py-2"
          >
            {revealed.sprite ? (
              <Image
                src={revealed.sprite}
                alt={revealed.name}
                width={160}
                height={160}
                className="size-40 object-contain sm:size-36"
                unoptimized
              />
            ) : null}
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {revealed.name}
            </p>
          </motion.div>
        ) : null}

        <pre className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap sm:max-h-48 sm:flex-none">
          {share}
        </pre>
        <p className="text-xs text-muted-foreground">
          Each attribute: proximity then direction — 🟩 exact · 🟨 ≤10% · 🟧 ≤25% ·
          ⬛ far · ⬆️ higher · ⬇️ lower · ✅ exact · types use ➖ (no direction)
        </p>

        <Button type="button" className="mt-auto w-full sm:mt-0" onClick={onShare}>
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
      </DialogContent>
    </Dialog>
  );
}
