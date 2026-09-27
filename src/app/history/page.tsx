"use client";

import { Suspense, useEffect, useState } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageGameMode } from "@/components/game/use-page-game-mode";
import { listLocalScaleGames } from "@/lib/game/scale-storage";
import { loadLocalStats } from "@/lib/storage";

type GuessItem = {
  kind: "guess";
  challengeId: number;
  date: string;
  difficulty: string;
  status: string;
  guesses: number[];
  completedAt: string | null;
};

type ResizeItem = {
  kind: "resize";
  challengeId: number;
  date: string;
  status: string;
  totalScore: number;
  rounds: number;
  completedAt: string | null;
};

function HistoryContent() {
  const { mode, ModeTabs } = usePageGameMode();
  const [guessItems, setGuessItems] = useState<GuessItem[]>([]);
  const [resizeItems, setResizeItems] = useState<ResizeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestNote, setGuestNote] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setGuestNote(null);
      setGuessItems([]);
      setResizeItems([]);
      try {
        if (mode === "guess") {
          const res = await fetch("/api/me/history");
          if (res.ok) {
            const data = await res.json();
            setGuessItems(
              data.map((item: Omit<GuessItem, "kind">) => ({
                ...item,
                kind: "guess" as const,
              })),
            );
            return;
          }
          const local = loadLocalStats();
          setGuestNote(
            local.played
              ? `Guest mode: ${local.played} Guess them games in this browser. Sign in to sync history.`
              : "Sign in with Google to keep Guess them history across devices.",
          );
          return;
        }

        const res = await fetch("/api/me/scale/history");
        if (res.ok) {
          const data = await res.json();
          setResizeItems(
            data.map((item: Omit<ResizeItem, "kind">) => ({
              ...item,
              kind: "resize" as const,
            })),
          );
          return;
        }
        const local = listLocalScaleGames();
        if (local.length) {
          setResizeItems(
            local.map((g) => ({
              kind: "resize" as const,
              challengeId: g.challengeId,
              date: g.date,
              status: g.status,
              totalScore: g.totalScore,
              rounds: g.rounds.length,
              completedAt: g.completedAt ?? null,
            })),
          );
          setGuestNote(
            `${local.length} Resize them run(s) in this browser. Sign in to sync across devices.`,
          );
        } else {
          setGuestNote(
            "Sign in with Google to keep Resize them history across devices.",
          );
        }
      } catch {
        setGuestNote("Sign in with Google to view history.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [mode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <History className="size-7 text-teal-600 dark:text-teal-300" />
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Past {mode === "guess" ? "Guess them" : "Resize them"} runs.
          </p>
        </div>
        <ModeTabs />
      </div>

      {loading ? <Skeleton className="h-40 w-full" /> : null}
      {guestNote ? (
        <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
          {guestNote}
        </div>
      ) : null}

      {mode === "guess" ? (
        <ul className="space-y-2">
          {guessItems.map((item) => (
            <li
              key={item.challengeId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:border-teal-500/50 hover:bg-teal-500/5"
              onClick={() => {
                window.location.href = `/?date=${item.date}`;
              }}
            >
              <div>
                <p className="font-medium">
                  #{item.challengeId} · {item.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.guesses.length} guess
                  {item.guesses.length === 1 ? "" : "es"}
                  {item.completedAt
                    ? ` · ${new Date(item.completedAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.difficulty}</Badge>
                <Badge
                  variant={item.status === "WON" ? "default" : "secondary"}
                >
                  {item.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {resizeItems.map((item) => (
            <li
              key={item.challengeId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:border-teal-500/50 hover:bg-teal-500/5"
              onClick={() => {
                window.location.href = `/resize-them/?${item.date}`;
              }}
            >
              <div>
                <p className="font-medium">
                  #{item.challengeId} · {item.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.rounds} rounds
                  {item.completedAt
                    ? ` · ${new Date(item.completedAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <Badge variant="default">{item.totalScore}/500</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
