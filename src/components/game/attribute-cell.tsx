"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Minus, X } from "lucide-react";
import type { AttributeResult, TypeResult } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<AttributeResult["status"], string> = {
  EXACT:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-200",
  VERY_CLOSE:
    "bg-amber-400/25 text-amber-900 ring-amber-500/30 dark:text-amber-100",
  CLOSE:
    "bg-orange-400/20 text-orange-900 ring-orange-500/30 dark:text-orange-100",
  FAR: "bg-muted text-muted-foreground ring-border/60",
};

export function statusClass(status: AttributeResult["status"]) {
  return statusStyles[status];
}

function DirectionIcon({ direction }: { direction: AttributeResult["direction"] }) {
  if (direction === "UP") return <ArrowUp className="size-3.5" />;
  if (direction === "DOWN") return <ArrowDown className="size-3.5" />;
  return <Minus className="size-3.5" />;
}

export function AttributeCell({
  result,
  delay = 0,
  label,
}: {
  result: AttributeResult;
  delay?: number;
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2 text-xs ring-1",
        statusClass(result.status),
      )}
      title={label}
    >
      <span className="font-medium tabular-nums">{result.guessValue}</span>
      <DirectionIcon direction={result.direction} />
    </motion.div>
  );
}

export function TypesCell({
  types,
  delay = 0,
}: {
  types: TypeResult[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 24 }}
      className="flex min-w-[7rem] flex-col gap-1"
    >
      {types.map((t) => (
        <span
          key={t.type}
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] capitalize ring-1",
            t.match
              ? "bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:text-emerald-200"
              : "bg-muted text-muted-foreground ring-border/60",
          )}
        >
          {t.type}
          {t.match ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        </span>
      ))}
    </motion.div>
  );
}

export function GenerationCell({
  result,
  delay = 0,
}: {
  result: AttributeResult;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "flex min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2 text-xs ring-1",
        statusClass(result.status),
      )}
    >
      <span className="font-medium">Gen {result.guessValue}</span>
      <DirectionIcon direction={result.direction} />
    </motion.div>
  );
}
