"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EvolutionHintMark } from "@/components/game/hint-icons";
import { MatchMark } from "@/components/game/match-mark";
import { StatChip } from "@/components/game/stat-chip";
import { TypeIcon } from "@/components/game/type-icon";
import { evolutionHintLabel } from "@/lib/game/hints";
import type { ColorResult, EvolutionResult, GuessResult } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

function EvolutionGuessMark({ evolution }: { evolution: EvolutionResult }) {
  const label = evolutionHintLabel(evolution.stage, evolution.lineLength);
  return (
    <MatchMark matched={evolution.match} label={label}>
      <EvolutionHintMark
        stage={evolution.stage}
        lineLength={evolution.lineLength}
        className="size-6"
      />
    </MatchMark>
  );
}

function ColorGuessChip({ color, match }: ColorResult) {
  return (
    <MatchMark matched={match} label={color}>
      <span
        className="size-6 rounded-full ring-1 ring-border/80"
        style={{ backgroundColor: color }}
      />
    </MatchMark>
  );
}

function HeaderHintGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-muted/40 px-1 py-0.5 ring-1 ring-border/60">
      {children}
    </div>
  );
}

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
  const [imageError, setImageError] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "rounded-xl border border-border/70 bg-background/80 p-2 shadow-sm backdrop-blur sm:p-2.5",
        result.isCorrect && "border-emerald-500/40 ring-1 ring-emerald-500/20",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 sm:size-9">
          {result.sprite && !imageError ? (
            <Image
              src={result.sprite}
              alt={result.name}
              width={36}
              height={36}
              className="size-7 object-contain sm:size-8"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex size-7 items-center justify-center text-[10px] font-medium text-muted-foreground sm:size-8">
              ?
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h3 className="truncate font-heading text-sm font-semibold tracking-tight">
            {result.name}
          </h3>
          {result.isCorrect ? (
            <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {a.types.length > 0 ? (
              <HeaderHintGroup>
                {a.types.map((t) => (
                  <TypeIcon key={t.type} type={t.type} matched={t.match} />
                ))}
              </HeaderHintGroup>
            ) : null}
            {a.evolution ? (
              <HeaderHintGroup>
                <EvolutionGuessMark evolution={a.evolution} />
              </HeaderHintGroup>
            ) : null}
            {a.colors && a.colors.length > 0 ? (
              <HeaderHintGroup>
                {a.colors.map((swatch, index) => (
                  <ColorGuessChip
                    key={`${swatch.color}-${index}`}
                    color={swatch.color}
                    match={swatch.match}
                  />
                ))}
              </HeaderHintGroup>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
        <StatChip
          stat="height"
          result={a.height}
          display={formatHeight(a.height.guessValue)}
          delay={base}
        />
        <StatChip
          stat="weight"
          result={a.weight}
          display={formatWeight(a.weight.guessValue)}
          delay={base + 0.04}
        />
        <StatChip stat="hp" result={a.hp} delay={base + 0.06} />
        <StatChip stat="attack" result={a.attack} delay={base + 0.08} />
        <StatChip stat="defense" result={a.defense} delay={base + 0.1} />
        <StatChip stat="specialAttack" result={a.specialAttack} delay={base + 0.12} />
        <StatChip stat="specialDefense" result={a.specialDefense} delay={base + 0.14} />
        <StatChip stat="speed" result={a.speed} delay={base + 0.16} />
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
    <div className="flex flex-col gap-1.5">
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
