"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultModal } from "@/components/game/result-modal";
import { EPOCH_DATE, challengeIdFromDate, getChallengeDate } from "@/lib/game/daily";
import type { GuessResult } from "@/lib/game/types";

type ChallengeDay = {
  id: number;
  date: string;
  played: boolean;
  status?: "WON" | "LOST";
  guesses?: number;
  results?: GuessResult[];
  score?: number;
  grade?: string;
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

export default function ArchivePage() {
  const [challenges, setChallenges] = useState<ChallengeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Generate all challenge days from epoch to today
        const today = getChallengeDate();
        const epochDate = new Date(EPOCH_DATE);
        const todayDate = new Date(today);
        const days: ChallengeDay[] = [];

        for (let d = new Date(epochDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          days.push({
            id: challengeIdFromDate(dateStr),
            date: dateStr,
            played: false,
          });
        }

        // Fetch user's games
        try {
          const res = await fetch("/api/me/games");
          if (res.ok) {
            const data = await res.json();
            const gamesMap = new Map(
              data.games.map((g: GameFromAPI) => [g.date, g])
            );

            // Mark played challenges
            days.forEach((day) => {
              const game = gamesMap.get(day.date);
              if (game) {
                day.played = true;
                day.status = game.status as "WON" | "LOST";
                day.guesses = game.guesses.length;
                day.results = game.results;
                day.score = game.score ?? undefined;
                day.grade = game.grade ?? undefined;
              }
            });
          }
        } catch {
          // Not logged in or error fetching games
        }

        // Reverse to show newest first
        setChallenges(days.reverse());
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleChallengeClick = (challenge: ChallengeDay) => {
    if (challenge.played && challenge.results) {
      setSelectedChallenge(challenge);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Archive className="size-7 text-teal-600 dark:text-teal-300" />
          Archive
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Play previous daily challenges or view your past results.
        </p>
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
            const canPlay = !challenge.played && (isPast || challenge.date === getChallengeDate());

            return (
              <div
                key={challenge.id}
                onClick={() => challenge.played && handleChallengeClick(challenge)}
                className={`
                  group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all
                  ${challenge.played && challenge.status === "WON"
                    ? "border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50"
                    : challenge.played && challenge.status === "LOST"
                    ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                    : "border-border/70 bg-background/70 hover:border-border"
                  }
                  ${challenge.played ? "cursor-pointer hover:scale-[1.02]" : ""}
                `}
              >
                {canPlay && (
                  <Link
                    href={`/?date=${challenge.date}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Play challenge #${challenge.id}`}
                  />
                )}

                <Calendar className="size-5 text-muted-foreground" />
                
                <div className="text-center">
                  <p className="font-heading text-lg font-semibold">
                    #{challenge.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(challenge.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {challenge.played ? (
                  <div className="flex flex-col items-center gap-1">
                    {challenge.status === "WON" ? (
                      <Badge variant="default" className="text-xs">
                        {challenge.guesses}/6
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        X/6
                      </Badge>
                    )}
                    {challenge.score !== undefined && (
                      <p className="text-xs font-medium text-muted-foreground">
                        {challenge.score}/100 · {challenge.grade}
                      </p>
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

      {selectedChallenge && selectedChallenge.results && (
        <ResultModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          won={selectedChallenge.status === "WON"}
          challengeId={selectedChallenge.id}
          results={selectedChallenge.results}
        />
      )}
    </div>
  );
}
