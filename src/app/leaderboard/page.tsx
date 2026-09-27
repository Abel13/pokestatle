"use client";

import { Suspense, useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePageGameMode } from "@/components/game/use-page-game-mode";

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

type ScaleDailyEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  completedAt: string | null;
};

type ScaleMonthlyEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  played: number;
  totalScore: number;
  avgScore: number;
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

function LeaderboardContent() {
  const { mode, ModeTabs } = usePageGameMode();
  const [period, setPeriod] = useState<Period>("today");
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [scaleDaily, setScaleDaily] = useState<ScaleDailyEntry[]>([]);
  const [scaleMonthly, setScaleMonthly] = useState<ScaleMonthlyEntry[]>([]);
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
    setMonthlyLoaded(false);
    setPeriod("today");
  }, [mode]);

  useEffect(() => {
    async function loadDaily() {
      setLoadingDaily(true);
      setError(null);
      try {
        const url =
          mode === "guess"
            ? "/api/leaderboard/today"
            : "/api/leaderboard/scale/today";
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setDailyMeta({ challengeId: data.challengeId, date: data.date });
        if (mode === "guess") {
          setDailyEntries(data.entries);
          setScaleDaily([]);
        } else {
          setScaleDaily(data.entries);
          setDailyEntries([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoadingDaily(false);
      }
    }
    void loadDaily();
  }, [mode]);

  useEffect(() => {
    if (period !== "month" || monthlyLoaded) return;

    async function loadMonthly() {
      setLoadingMonthly(true);
      setError(null);
      try {
        const url =
          mode === "guess"
            ? "/api/leaderboard/month"
            : "/api/leaderboard/scale/month";
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMonthlyMeta({
          yearMonth: data.yearMonth,
          startDate: data.startDate,
          endDate: data.endDate,
        });
        if (mode === "guess") {
          setMonthlyEntries(data.entries);
          setScaleMonthly([]);
        } else {
          setScaleMonthly(data.entries);
          setMonthlyEntries([]);
        }
        setMonthlyLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      } finally {
        setLoadingMonthly(false);
      }
    }
    void loadMonthly();
  }, [period, monthlyLoaded, mode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Trophy className="size-7 text-teal-600 dark:text-teal-300" />
            Ranking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "guess"
              ? "Daily winners by fewest guesses. Monthly leaders by total score."
              : "Daily leaders by Resize them score. Monthly leaders by total score."}
          </p>
        </div>
        <ModeTabs />
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
            {mode === "guess"
              ? "Winners ranked by fewest guesses. Ties broken by completion time."
              : "Ranked by overall Resize them score (out of 500)."}
            {dailyMeta
              ? ` Challenge #${dailyMeta.challengeId} · ${dailyMeta.date}`
              : null}
          </p>

          {loadingDaily ? <Skeleton className="h-40 w-full" /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {mode === "guess" ? (
            <>
              {!loadingDaily && !error && dailyEntries.length === 0 ? (
                <EmptyBoard />
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
                    <PlayerAvatar
                      name={entry.displayName}
                      avatarUrl={entry.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {entry.displayName}
                        </p>
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
                        {entry.score}/100 · {entry.grade}
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
            </>
          ) : (
            <>
              {!loadingDaily && !error && scaleDaily.length === 0 ? (
                <EmptyBoard />
              ) : null}
              <ol className="space-y-2">
                {scaleDaily.map((entry, index) => (
                  <li
                    key={entry.userId}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3"
                  >
                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      name={entry.displayName}
                      avatarUrl={entry.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.displayName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-lg font-semibold tabular-nums">
                        {entry.totalScore}
                      </p>
                      <p className="text-[10px] text-muted-foreground">/500</p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ranked by total score this month
            {monthlyMeta
              ? ` (${formatMonthLabel(monthlyMeta.yearMonth)})`
              : ""}
            .
          </p>

          {loadingMonthly ? <Skeleton className="h-40 w-full" /> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {mode === "guess" ? (
            <>
              {!loadingMonthly &&
              monthlyLoaded &&
              !error &&
              monthlyEntries.length === 0 ? (
                <EmptyBoard month />
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
                    <PlayerAvatar
                      name={entry.displayName}
                      avatarUrl={entry.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.wins}/{entry.played} wins · avg {entry.avgScore}
                        /100
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
            </>
          ) : (
            <>
              {!loadingMonthly &&
              monthlyLoaded &&
              !error &&
              scaleMonthly.length === 0 ? (
                <EmptyBoard month />
              ) : null}
              <ol className="space-y-2">
                {scaleMonthly.map((entry, index) => (
                  <li
                    key={entry.userId}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3"
                  >
                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      name={entry.displayName}
                      avatarUrl={entry.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.played} played · avg {entry.avgScore}/500
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <Avatar className="size-9">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function EmptyBoard({ month }: { month?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
      {month
        ? "No completed runs this month yet."
        : "No completed runs on the leaderboard yet. Sign in and finish today’s challenge to appear here."}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
