"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type Entry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  guesses: number;
  completedAt: string | null;
  currentStreak: number;
  maxStreak: number;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [meta, setMeta] = useState<{ challengeId: number; date: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard/today");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setEntries(data.entries);
        setMeta({ challengeId: data.challengeId, date: data.date });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Trophy className="size-7 text-teal-600 dark:text-teal-300" />
          Today&apos;s ranking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fewer guesses win. Ties broken by completion time.
          {meta ? ` Challenge #${meta.challengeId} · ${meta.date}` : null}
        </p>
      </div>

      {loading ? <Skeleton className="h-40 w-full" /> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
          No completed runs on the leaderboard yet. Sign in with Google and win
          today&apos;s challenge to appear here.
        </div>
      ) : null}

      <ol className="space-y-2">
        {entries.map((entry, index) => (
          <li
            key={entry.userId}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3"
          >
            <span className="w-6 text-center text-sm font-medium text-muted-foreground">
              {index + 1}
            </span>
            <Avatar className="size-9">
              {entry.avatarUrl ? (
                <AvatarImage src={entry.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {entry.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{entry.displayName}</p>
              <p className="text-xs text-muted-foreground">
                Streak {entry.currentStreak} · Best {entry.maxStreak}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-lg font-semibold tabular-nums">
                {entry.guesses}/6
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
