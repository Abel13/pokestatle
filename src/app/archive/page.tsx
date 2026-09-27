"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageGameMode } from "@/components/game/use-page-game-mode";
import {
  EPOCH_DATE,
  challengeIdFromDate,
  getChallengeDate,
} from "@/lib/game/daily";
import { listLocalScaleGames } from "@/lib/game/scale-storage";
import type { GuessResult } from "@/lib/game/types";

type ChallengeDay = {
  id: number;
  date: string;
  played: boolean;
  status?: string;
  guesses?: number;
  results?: GuessResult[];
  score?: number;
  grade?: string;
  totalScore?: number;
};

type GameFromAPI = {
  challengeId: number;
  date: string;
  status: string;
  guesses: number[];
  results: GuessResult[];
  completedAt: string | null;
  score: number | null;
  grade: string | null;
};

type ScaleGameFromAPI = {
  challengeId: number;
  date: string;
  status: string;
  totalScore: number;
  rounds: unknown[];
};

function ArchiveContent() {
  const { mode, ModeTabs } = usePageGameMode();
  const [challenges, setChallenges] = useState<ChallengeDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const today = getChallengeDate();
        const epochDate = new Date(EPOCH_DATE);
        const todayDate = new Date(today);
        const days: ChallengeDay[] = [];

        for (
          let d = new Date(epochDate);
          d <= todayDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = d.toISOString().split("T")[0]!;
          days.push({
            id: challengeIdFromDate(dateStr),
            date: dateStr,
            played: false,
          });
        }

        if (mode === "guess") {
          try {
            const res = await fetch("/api/me/games");
            if (res.ok) {
              const data = await res.json();
              const gamesMap = new Map<string, GameFromAPI>(
                data.games.map((g: GameFromAPI) => [g.date, g]),
              );
              days.forEach((day) => {
                const game = gamesMap.get(day.date);
                if (game) {
                  day.played = true;
                  day.status = game.status;
                  day.guesses = game.guesses.length;
                  day.results = game.results;
                  day.score = game.score ?? undefined;
                  day.grade = game.grade ?? undefined;
                }
              });
            }
          } catch {
            // guest
          }
        } else {
          const local = listLocalScaleGames();
          const localMap = new Map(local.map((g) => [g.date, g]));
          try {
            const res = await fetch("/api/me/scale/games");
            if (res.ok) {
              const data = await res.json();
              for (const g of data.games as ScaleGameFromAPI[]) {
                localMap.set(g.date, {
                  challengeId: g.challengeId,
                  date: g.date,
                  rounds: [],
                  totalScore: g.totalScore,
                  status: g.status as "COMPLETE" | "PLAYING",
                });
              }
            }
          } catch {
            // guest local only
          }
          days.forEach((day) => {
            const game = localMap.get(day.date);
            if (game && game.status === "COMPLETE") {
              day.played = true;
              day.status = game.status;
              day.totalScore = game.totalScore;
            }
          });
        }

        setChallenges(days.reverse());
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [mode]);

  const playHref = (date: string) =>
    mode === "guess" ? `/?date=${date}` : `/resize-them/?${date}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Archive className="size-7 text-teal-600 dark:text-teal-300" />
            Archive
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "guess"
              ? "Past Guess them challenges and your results."
              : "Past Resize them days and your scores."}
          </p>
        </div>
        <ModeTabs />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {challenges.map((challenge) => {
            const isPast = challenge.date < getChallengeDate();
            const canPlay =
              !challenge.played &&
              (isPast || challenge.date === getChallengeDate());

            return (
              <div
                key={`${mode}-${challenge.id}`}
                onClick={() => {
                  if (challenge.played) {
                    window.location.href = playHref(challenge.date);
                  }
                }}
                className={`
                  group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all
                  ${
                    challenge.played &&
                    (challenge.status === "WON" ||
                      challenge.status === "COMPLETE")
                      ? "border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50"
                      : challenge.played && challenge.status === "LOST"
                        ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                        : "border-border/70 bg-background/70 hover:border-border"
                  }
                  ${challenge.played ? "cursor-pointer hover:scale-[1.02]" : ""}
                `}
              >
                {canPlay ? (
                  <Link
                    href={playHref(challenge.date)}
                    className="absolute inset-0 z-10"
                    aria-label={`Play challenge #${challenge.id}`}
                  />
                ) : null}

                <Calendar className="size-5 text-muted-foreground" />

                <div className="text-center">
                  <p className="font-heading text-lg font-semibold">
                    #{challenge.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(challenge.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {challenge.played ? (
                  <div className="flex flex-col items-center gap-1">
                    {mode === "guess" ? (
                      <>
                        {challenge.status === "WON" ? (
                          <Badge variant="default" className="text-xs">
                            {challenge.guesses}/6
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            X/6
                          </Badge>
                        )}
                        {challenge.score !== undefined ? (
                          <p className="text-xs font-medium text-muted-foreground">
                            {challenge.score}/100 · {challenge.grade}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        {challenge.totalScore}/500
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Not played
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <ArchiveContent />
    </Suspense>
  );
}
