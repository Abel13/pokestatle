"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageGameMode } from "@/components/game/use-page-game-mode";
import { listLocalScaleGames } from "@/lib/game/scale-storage";
import { loadLocalStats, type LocalStats } from "@/lib/storage";

type GuessStats = {
  kind: "guess";
  played: number;
  wins: number;
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  source: string;
};

type ResizeStats = {
  kind: "resize";
  played: number;
  avgScore: number;
  bestScore: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  source: string;
};

type Stats = GuessStats | ResizeStats;

function StatsContent() {
  const { mode, ModeTabs } = usePageGameMode();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStats(null);
      try {
        if (mode === "guess") {
          try {
            const res = await fetch("/api/me/stats");
            if (cancelled) return;
            if (res.ok) {
              const data = await res.json();
              setStats({ kind: "guess", ...data, source: "account" });
              return;
            }
          } catch {
            // local
          }
          if (cancelled) return;
          setStats(mapLocalGuess(loadLocalStats()));
          return;
        }

        try {
          const res = await fetch("/api/me/scale/stats");
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            setStats({ kind: "resize", ...data, source: "account" });
            return;
          }
        } catch {
          // local
        }
        if (cancelled) return;
        setStats(mapLocalResize());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!stats) return null;
  const maxDist = Math.max(1, ...stats.distribution);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <BarChart3 className="size-7 text-teal-600 dark:text-teal-300" />
            Stats
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Source:{" "}
            {stats.source === "account" ? "signed-in account" : "this browser"}
          </p>
        </div>
        <ModeTabs />
      </div>

      {stats.kind === "guess" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Played", stats.played],
            ["Win %", stats.winPct],
            ["Current", stats.currentStreak],
            ["Max streak", stats.maxStreak],
          ].map(([label, value], i) => (
            <StatCard
              key={label as string}
              label={label as string}
              value={value as number}
              delay={i}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Played", stats.played],
            ["Avg score", stats.avgScore],
            ["Best", stats.bestScore],
            ["Max streak", stats.maxStreak],
          ].map(([label, value], i) => (
            <StatCard
              key={label as string}
              label={label as string}
              value={value as number}
              delay={i}
            />
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-5">
        <h2 className="text-sm font-medium">
          {stats.kind === "guess"
            ? "Guess distribution"
            : "Score buckets (out of 500)"}
        </h2>
        <div className="space-y-2">
          {stats.distribution.map((count, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="w-14 shrink-0 tabular-nums text-muted-foreground">
                {stats.kind === "guess"
                  ? index + 1
                  : `${index * 100}–${index === 4 ? 500 : index * 100 + 99}`}
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded bg-muted/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(count > 0 ? 8 : 0, (count / maxDist) * 100)}%`,
                  }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="flex h-full items-center justify-end rounded bg-teal-600/80 px-2 text-xs text-white dark:bg-teal-400/80 dark:text-teal-950"
                >
                  {count > 0 ? count : ""}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
      className="rounded-2xl border border-border/70 bg-background/70 p-4"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </motion.div>
  );
}

function mapLocalGuess(local: LocalStats): GuessStats {
  return {
    kind: "guess",
    played: local.played,
    wins: local.wins,
    winPct: local.played ? Math.round((local.wins / local.played) * 100) : 0,
    currentStreak: local.currentStreak,
    maxStreak: local.maxStreak,
    distribution: local.distribution,
    source: "local",
  };
}

function mapLocalResize(): ResizeStats {
  const games = listLocalScaleGames();
  const played = games.length;
  const total = games.reduce((s, g) => s + g.totalScore, 0);
  const bestScore = games.reduce((m, g) => Math.max(m, g.totalScore), 0);
  const distribution = [0, 0, 0, 0, 0];
  for (const g of games) {
    const idx = Math.min(4, Math.floor(g.totalScore / 100));
    distribution[idx] = (distribution[idx] ?? 0) + 1;
  }
  return {
    kind: "resize",
    played,
    avgScore: played ? Math.round(total / played) : 0,
    bestScore,
    currentStreak: 0,
    maxStreak: 0,
    distribution,
    source: "local",
  };
}

export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <StatsContent />
    </Suspense>
  );
}
