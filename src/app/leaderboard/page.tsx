"use client";

import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DailyEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  guesses: number;
  completedAt: string | null;
  currentStreak: number;
  maxStreak: number;
  score: number;
  grade: string;
  efficiency: number;
  accuracy: number;
};

type MonthlyEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  played: number;
  wins: number;
  totalScore: number;
  avgScore: number;
  currentStreak: number;
  maxStreak: number;
};

type Period = "today" | "month";

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) return yearMonth;
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [dailyMeta, setDailyMeta] = useState<{
    challengeId: number;
    date: string;
  } | null>(null);
  const [monthlyMeta, setMonthlyMeta] = useState<{
    yearMonth: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyLoaded, setMonthlyLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDaily() {
      try {
        const res = await fetch("/api/leaderboard/today");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setDailyEntries(data.entries);
        setDailyMeta({ challengeId: data.challengeId, date: data.date });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoadingDaily(false);
      }
    }
    void loadDaily();
  }, []);

  useEffect(() => {
    if (period !== "month" || monthlyLoaded) return;

    async function loadMonthly() {
      setLoadingMonthly(true);
      setError(null);
      try {
        const res = await fetch("/api/leaderboard/month");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMonthlyEntries(data.entries);
        setMonthlyMeta({
          yearMonth: data.yearMonth,
          startDate: data.startDate,
          endDate: data.endDate,
        });
        setMonthlyLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoadingMonthly(false);
      }
    }
    void loadMonthly();
  }, [period, monthlyLoaded]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Trophy className="size-7 text-teal-600 dark:text-teal-300" />
          Ranking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily winners by fewest guesses. Monthly leaders by total score this
          month.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Ranking period"
        className="inline-flex rounded-lg bg-muted p-[3px]"
      >
        {(
          [
            { id: "today", label: "Today" },
            { id: "month", label: "This month" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={period === item.id}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              period === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setPeriod(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {period === "today" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Winners ranked by fewest guesses. Ties broken by completion time.
            Players who didn&apos;t solve it are shown below.
            {dailyMeta
              ? ` Challenge #${dailyMeta.challengeId} · ${dailyMeta.date}`
              : null}
          </p>

          {loadingDaily ? <Skeleton className="h-40 w-full" /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loadingDaily && !error && dailyEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              No completed runs on the leaderboard yet. Sign in with Google and
              win today&apos;s challenge to appear here.
            </div>
          ) : null}

          <ol className="space-y-2">
            {dailyEntries.map((entry, index) => (
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
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{entry.displayName}</p>
                    {entry.status === "LOST" ? (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 text-xs"
                      >
                        <X className="size-3" />
                        Lost
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.status === "WON" ? (
                      <>
                        {entry.score}/100 · {entry.grade} · efficiency{" "}
                        {entry.efficiency} · accuracy {entry.accuracy}
                      </>
                    ) : (
                      <>
                        {entry.score}/100 · {entry.grade} · clue quality{" "}
                        {entry.accuracy}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Streak {entry.currentStreak} · Best {entry.maxStreak}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-semibold tabular-nums">
                    {entry.status === "LOST" ? "X" : entry.guesses}/6
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ranked by total score this month
            {monthlyMeta
              ? ` (${formatMonthLabel(monthlyMeta.yearMonth)} · ${monthlyMeta.startDate} → ${monthlyMeta.endDate})`
              : ""}
            . Ties broken by wins, then games played.
          </p>

          {loadingMonthly ? <Skeleton className="h-40 w-full" /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loadingMonthly &&
          monthlyLoaded &&
          !error &&
          monthlyEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              No completed runs this month yet. Sign in and finish daily
              challenges to climb the monthly ranking.
            </div>
          ) : null}

          <ol className="space-y-2">
            {monthlyEntries.map((entry, index) => (
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
                    {entry.wins}/{entry.played} wins · avg {entry.avgScore}/100
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Streak {entry.currentStreak} · Best {entry.maxStreak}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-semibold tabular-nums">
                    {entry.totalScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
