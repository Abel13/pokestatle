"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
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

export function DirectionIcon({
  direction,
  className,
}: {
  direction: AttributeResult["direction"];
  className?: string;
}) {
  if (direction === "UP") return <ArrowUp className={cn("size-3", className)} />;
  if (direction === "DOWN")
    return <ArrowDown className={cn("size-3", className)} />;
  return <Minus className={cn("size-3", className)} />;
}

export function StatChip({
  label,
  result,
  display,
  delay = 0,
}: {
  label: string;
  result: AttributeResult;
  display?: string | number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 ring-1",
        statusClass(result.status),
      )}
      title={`${label}: ${display ?? result.guessValue}`}
    >
      <span className="text-[9px] font-medium tracking-wide uppercase opacity-70">
        {label}
      </span>
      <span className="flex items-center gap-0.5 text-[11px] leading-none font-semibold tabular-nums sm:text-xs">
        {display ?? result.guessValue}
        <DirectionIcon direction={result.direction} />
      </span>
    </motion.div>
  );
}
