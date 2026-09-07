"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Copy, PartyPopper, X } from "lucide-react";
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

  async function copy() {
    await navigator.clipboard.writeText(share);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader>
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
            className="flex flex-col items-center gap-2 py-2"
          >
            {revealed.sprite ? (
              <Image
                src={revealed.sprite}
                alt={revealed.name}
                width={160}
                height={160}
                className="size-36 object-contain"
                unoptimized
              />
            ) : null}
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {revealed.name}
            </p>
          </motion.div>
        ) : null}

        <pre className="max-h-48 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {share}
        </pre>
        <p className="text-xs text-muted-foreground">
          Each attribute: proximity then direction — 🟩 exact · 🟨 ≤10% · 🟧 ≤25% ·
          ⬛ far · ⬆️ higher · ⬇️ lower · ✅ exact · types use ➖ (no direction)
        </p>

        <Button type="button" className="w-full" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy Result"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
