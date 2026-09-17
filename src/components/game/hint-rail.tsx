"use client";

import { motion } from "framer-motion";
import { TypeIcon } from "@/components/game/type-icon";
import {
  ColorHintMark,
  EvolutionHintMark,
  GenerationHintMark,
  LockedHintMark,
} from "@/components/game/hint-icons";
import type { ChallengeHints, HintKind } from "@/lib/game/hints";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 360, damping: 28 };

const TITLES: Record<HintKind, string> = {
  generation: "Generation",
  types: "Types",
  evolution: "Evolution",
  colors: "Colors",
};

const UNLOCK_ROUND: Record<HintKind, number> = {
  generation: 1,
  types: 3,
  evolution: 5,
  colors: 6,
};

function SlotShell({
  title,
  children,
  unlocked,
}: {
  title: string;
  children: React.ReactNode;
  unlocked: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-center sm:min-h-[5.75rem] sm:gap-1.5 sm:rounded-2xl sm:px-2.5 sm:py-2.5",
        unlocked
          ? "border-border/70 bg-background/80"
          : "border-dashed border-border/60 bg-muted/20",
      )}
    >
      <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function UnlockedBody({
  justUnlocked,
  children,
}: {
  justUnlocked: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={justUnlocked ? { opacity: 0, y: 8, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="flex flex-col items-center gap-1"
    >
      {children}
    </motion.div>
  );
}

export function HintRail({
  hints,
  justUnlocked,
}: {
  hints: ChallengeHints | null;
  justUnlocked: HintKind[];
}) {
  const fresh = (kind: HintKind) => justUnlocked.includes(kind);

  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-2">
      <SlotShell title={TITLES.generation} unlocked={Boolean(hints?.generation)}>
        {hints?.generation ? (
          <UnlockedBody justUnlocked={fresh("generation")}>
            <motion.div
              initial={fresh("generation") ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <GenerationHintMark
                roman={hints.generation.roman}
                className="size-7 sm:size-9"
              />
            </motion.div>
            <p className="font-heading text-[11px] font-medium tracking-tight sm:text-sm">
              Gen {hints.generation.roman}
              <span className="hidden text-muted-foreground sm:inline">
                {" "}
                · {hints.generation.region}
              </span>
            </p>
          </UnlockedBody>
        ) : (
          <LockedSlot kind="generation" />
        )}
      </SlotShell>

      <SlotShell title={TITLES.types} unlocked={Boolean(hints?.types)}>
        {hints?.types ? (
          <UnlockedBody justUnlocked={fresh("types")}>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {hints.types.map((type, i) => (
                <motion.div
                  key={type}
                  initial={fresh("types") ? { opacity: 0, y: 4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.06 }}
                >
                  <TypeIcon type={type} className="size-5 sm:size-6" />
                </motion.div>
              ))}
            </div>
            <p className="hidden text-[11px] capitalize text-muted-foreground sm:block">
              {hints.types.join(" / ")}
            </p>
          </UnlockedBody>
        ) : (
          <LockedSlot kind="types" />
        )}
      </SlotShell>

      <SlotShell
        title={TITLES.evolution}
        unlocked={Boolean(hints?.evolution)}
      >
        {hints?.evolution ? (
          <UnlockedBody justUnlocked={fresh("evolution")}>
            <EvolutionHintMark
              stage={hints.evolution.stage}
              lineLength={hints.evolution.lineLength}
              animate={fresh("evolution")}
              className="size-7 sm:size-9"
            />
            <p className="hidden max-w-[9.5rem] text-[11px] leading-snug text-muted-foreground sm:block">
              {hints.evolution.label}
            </p>
          </UnlockedBody>
        ) : (
          <LockedSlot kind="evolution" />
        )}
      </SlotShell>

      <SlotShell title={TITLES.colors} unlocked={Boolean(hints?.colors)}>
        {hints?.colors ? (
          <UnlockedBody justUnlocked={fresh("colors")}>
            <motion.div
              initial={fresh("colors") ? { scale: 0.6, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
            >
              <ColorHintMark
                primary={hints.colors.primary}
                secondary={hints.colors.secondary}
                className="size-7 sm:size-9"
              />
            </motion.div>
            <p
              className="hidden text-[11px] text-muted-foreground sm:block"
              aria-label={`${hints.colors.primary} and ${hints.colors.secondary}`}
            >
              Main palette
            </p>
          </UnlockedBody>
        ) : (
          <LockedSlot kind="colors" />
        )}
      </SlotShell>
    </div>
  );
}

function LockedSlot({ kind }: { kind: HintKind }) {
  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <LockedHintMark className="size-7 sm:size-9" />
      <p className="text-[9px] text-muted-foreground sm:text-[11px]">
        <span className="sm:hidden">{UNLOCK_ROUND[kind]}</span>
        <span className="hidden sm:inline">Guess {UNLOCK_ROUND[kind]}</span>
      </p>
    </div>
  );
}
