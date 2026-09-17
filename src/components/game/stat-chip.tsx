"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { StatIcon, STAT_LABELS, STAT_UNITS, type StatKind } from "@/components/game/stat-icons";
import type { AttributeResult } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export const statusStyles: Record<AttributeResult["status"], string> = {
  EXACT:
    "bg-emerald-500/20 text-emerald-800 ring-emerald-500/35 dark:text-emerald-200",
  VERY_CLOSE:
    "bg-amber-400/25 text-amber-950 ring-amber-500/35 dark:text-amber-100",
  CLOSE:
    "bg-orange-400/20 text-orange-950 ring-orange-500/35 dark:text-orange-100",
  FAR: "bg-muted/80 text-muted-foreground ring-border/50",
};

export function statusClass(status: AttributeResult["status"]) {
  return statusStyles[status];
}

/** Far → direction only. Close / exact → color only (no arrow). */
export function showsDirection(status: AttributeResult["status"]) {
  return status === "FAR";
}

export function DirectionIcon({
  direction,
  className,
}: {
  direction: AttributeResult["direction"];
  className?: string;
}) {
  if (direction === "UP") return <ArrowUp className={cn("size-2.5", className)} />;
  if (direction === "DOWN")
    return <ArrowDown className={cn("size-2.5", className)} />;
  return null;
}

export function StatChip({
  stat,
  result,
  display,
  delay = 0,
}: {
  stat: StatKind;
  result: AttributeResult;
  display?: string | number;
  delay?: number;
}) {
  const showDirection = showsDirection(result.status);
  const label = STAT_LABELS[stat];
  const unit = STAT_UNITS[stat];
  const value = display ?? result.guessValue;
  const caption = unit ? `${label}: ${value} ${unit}` : `${label}: ${value}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-1 rounded-lg px-1 py-1 ring-1 sm:gap-x-2 sm:px-2 sm:py-1.5",
        statusClass(result.status),
      )}
      title={caption}
      aria-label={caption}
    >
      <span className="flex flex-col items-center gap-0.5">
        <StatIcon kind={stat} className="size-4 opacity-90 sm:size-[1.125rem]" />
        <span className="text-[8px] font-medium leading-none tracking-wide uppercase opacity-70 sm:text-[9px]">
          {label}
        </span>
      </span>
      <span className="flex min-w-0 items-center justify-end gap-px whitespace-nowrap text-xs font-semibold tabular-nums sm:gap-0.5 sm:text-sm">
        {value}
        {unit ? (
          <span className="text-[9px] font-medium opacity-70 sm:text-[10px]">
            {unit}
          </span>
        ) : null}
        {showDirection ? (
          <DirectionIcon direction={result.direction} className="size-3" />
        ) : null}
      </span>
    </motion.div>
  );
}
