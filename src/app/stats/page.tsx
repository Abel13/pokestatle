"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { loadLocalStats, type LocalStats } from "@/lib/storage";

type RemoteStats = {
  played: number;
  wins: number;
  winPct: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
};

export default function StatsPage() {
  const [stats, setStats] = useState<(RemoteStats & { source: string }) | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me/stats");
        if (res.ok) {
          const data = (await res.json()) as RemoteStats;
          setStats({ ...data, source: "account" });
          return;
        }
      } catch {
        // fall through to local
      }
      const local = loadLocalStats();
      setStats(mapLocal(local));
    }
    void load().finally(() => setLoading(false));
  }, []);

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
      <div>
        <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <BarChart3 className="size-7 text-teal-600 dark:text-teal-300" />
          Stats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source: {stats.source === "account" ? "signed-in account" : "this browser"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Played", stats.played],
          ["Win %", stats.winPct],
          ["Current", stats.currentStreak],
          ["Max streak", stats.maxStreak],
        ].map(([label, value], i) => (
          <motion.div
            key={label as string}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border/70 bg-background/70 p-4"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-5">
        <h2 className="text-sm font-medium">Guess distribution</h2>
        <div className="space-y-2">
          {stats.distribution.map((count, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="w-4 tabular-nums text-muted-foreground">
                {index + 1}
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

function mapLocal(local: LocalStats): RemoteStats & { source: string } {
  return {
    played: local.played,
    wins: local.wins,
    winPct: local.played ? Math.round((local.wins / local.played) * 100) : 0,
    currentStreak: local.currentStreak,
    maxStreak: local.maxStreak,
    distribution: local.distribution,
    source: "local",
  };
}
