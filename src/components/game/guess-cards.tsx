"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { StatChip } from "@/components/game/stat-chip";
import { TypeIcon } from "@/components/game/type-icon";
import type { GuessResult } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function formatHeight(dm: number) {
  return (dm / 10).toFixed(1);
}
function formatWeight(hg: number) {
  return (hg / 10).toFixed(1);
}

function GuessCard({
  result,
  index,
}: {
  result: GuessResult;
  index: number;
}) {
  const a = result.attributes;
  const base = Math.min(index, 4) * 0.03;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm backdrop-blur sm:p-3.5",
        result.isCorrect && "border-emerald-500/40 ring-1 ring-emerald-500/20",
      )}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 sm:size-12">
          {result.sprite ? (
            <Image
              src={result.sprite}
              alt=""
              width={44}
              height={44}
              className="size-10 object-contain sm:size-11"
              unoptimized
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-heading text-sm font-semibold tracking-tight sm:text-base">
              {result.name}
            </h3>
            {result.isCorrect ? (
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
            ) : null}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {a.types.map((t) => (
              <TypeIcon key={t.type} type={t.type} matched={t.match} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-9">
        <StatChip
          label="Gen"
          result={a.generation}
          display={a.generation.guessValue}
          delay={base}
        />
        <StatChip
          label="Ht"
          result={a.height}
          display={formatHeight(a.height.guessValue)}
          delay={base + 0.04}
        />
        <StatChip
          label="Wt"
          result={a.weight}
          display={formatWeight(a.weight.guessValue)}
          delay={base + 0.06}
        />
        <StatChip label="HP" result={a.hp} delay={base + 0.08} />
        <StatChip label="Atk" result={a.attack} delay={base + 0.1} />
        <StatChip label="Def" result={a.defense} delay={base + 0.12} />
        <StatChip label="SpA" result={a.specialAttack} delay={base + 0.14} />
        <StatChip label="SpD" result={a.specialDefense} delay={base + 0.16} />
        <StatChip label="Spe" result={a.speed} delay={base + 0.18} />
      </div>
    </motion.article>
  );
}

export function GuessCards({ results }: { results: GuessResult[] }) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Make a guess to start revealing clues.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {[...results].reverse().map((result, index) => (
        <GuessCard
          key={`${result.pokemonId}-${results.length - index}`}
          result={result}
          index={index}
        />
      ))}
    </div>
  );
}
