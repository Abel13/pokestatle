"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const springClass = "shrink-0";

export function GenerationHintMark({
  roman,
  className,
}: {
  roman: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn(springClass, "size-9", className)}
      role="img"
      aria-hidden
    >
      <rect
        x="4"
        y="5"
        width="32"
        height="30"
        rx="6"
        className="fill-teal-600/15 stroke-teal-700 dark:fill-teal-400/15 dark:stroke-teal-300"
        strokeWidth="1.6"
      />
      <rect
        x="8"
        y="9"
        width="24"
        height="16"
        rx="3"
        className="fill-background/90 stroke-teal-700/40 dark:stroke-teal-300/40"
        strokeWidth="1"
      />
      <text
        x="20"
        y="21"
        textAnchor="middle"
        className="fill-teal-800 dark:fill-teal-200"
        fontSize="9"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {roman}
      </text>
      <rect
        x="10"
        y="28"
        width="8"
        height="3"
        rx="1"
        className="fill-teal-600/70 dark:fill-teal-400/70"
      />
      <rect
        x="20"
        y="28"
        width="10"
        height="3"
        rx="1"
        className="fill-sky-500/70 dark:fill-sky-300/70"
      />
    </svg>
  );
}

export function EvolutionHintMark({
  stage,
  lineLength,
  animate = false,
  className,
}: {
  stage: number;
  lineLength: number;
  animate?: boolean;
  className?: string;
}) {
  const count = Math.min(3, Math.max(1, lineLength));
  const active = Math.min(count, Math.max(1, stage));
  const nodes = Array.from({ length: count }, (_, i) => i + 1);
  const width = 40;
  const start = count === 1 ? 20 : count === 2 ? 12 : 8;
  const gap = count === 1 ? 0 : (width - start * 2) / (count - 1);
  const spring = { type: "spring" as const, stiffness: 360, damping: 28 };

  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-9 shrink-0", className)}
      role="img"
      aria-hidden
    >
      {nodes.slice(0, -1).map((n) => {
        const x1 = start + (n - 1) * gap;
        const x2 = start + n * gap;
        return (
          <line
            key={`l-${n}`}
            x1={x1 + 5}
            y1="20"
            x2={x2 - 5}
            y2="20"
            className="stroke-teal-700/35 dark:stroke-teal-300/35"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        );
      })}
      {nodes.map((n) => {
        const cx = start + (n - 1) * gap;
        const isActive = n === active;
        return (
          <motion.circle
            key={n}
            cx={cx}
            cy="20"
            r={isActive ? 6.2 : 4.4}
            className={
              isActive
                ? "fill-teal-600 stroke-teal-800 dark:fill-teal-400 dark:stroke-teal-200"
                : "fill-background stroke-teal-700/50 dark:stroke-teal-300/50"
            }
            strokeWidth="1.6"
            initial={animate ? { opacity: 0.2, scale: 0.85 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: (n - 1) * 0.08 }}
            style={{ transformOrigin: `${cx}px 20px` }}
          />
        );
      })}
    </svg>
  );
}

export function ColorHintMark({
  primary,
  secondary,
  className,
}: {
  primary: string;
  secondary: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn(springClass, "size-9", className)}
      role="img"
      aria-hidden
    >
      <circle cx="16" cy="20" r="10" fill={primary} className="stroke-border" strokeWidth="1" />
      <circle cx="25" cy="20" r="10" fill={secondary} className="stroke-border" strokeWidth="1" />
      <circle
        cx="20.5"
        cy="20"
        r="4.5"
        className="fill-background/35"
      />
    </svg>
  );
}

export function LockedHintMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn(springClass, "size-9 text-muted-foreground/70", className)}
      role="img"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r="11"
        fill="none"
        className="stroke-current"
        strokeWidth="1.6"
        strokeDasharray="3 3"
      />
      <circle cx="20" cy="20" r="3" className="fill-current opacity-40" />
    </svg>
  );
}
