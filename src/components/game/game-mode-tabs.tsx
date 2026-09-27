"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  GAME_MODES,
  type GameMode,
  savePreferredGameMode,
} from "@/lib/game/modes";

export function GameModeTabs({
  mode,
  onChange,
  /** When set, tabs navigate instead of (or in addition to) onChange. */
  hrefForMode,
  className,
}: {
  mode: GameMode;
  onChange?: (mode: GameMode) => void;
  hrefForMode?: (mode: GameMode) => string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Game mode"
      className={cn(
        "inline-flex rounded-xl border border-border/70 bg-muted/40 p-1",
        className,
      )}
    >
      {GAME_MODES.map((m) => {
        const selected = mode === m.id;
        const classNameInner = cn(
          "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
          selected
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        );

        if (hrefForMode) {
          return (
            <Link
              key={m.id}
              role="tab"
              aria-selected={selected}
              href={hrefForMode(m.id)}
              onClick={() => savePreferredGameMode(m.id)}
              className={classNameInner}
            >
              {m.shortLabel}
            </Link>
          );
        }

        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={classNameInner}
            onClick={() => {
              savePreferredGameMode(m.id);
              onChange?.(m.id);
            }}
          >
            {m.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
