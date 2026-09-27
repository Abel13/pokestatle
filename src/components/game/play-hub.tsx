"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/game/game-board";
import { GameModeTabs } from "@/components/game/game-mode-tabs";
import { ScaleBoard } from "@/components/scale/scale-board";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveChallengeDateParam } from "@/lib/game/challenge-date-param";
import {
  GAME_MODES,
  type GameMode,
  gameModePlayPath,
  savePreferredGameMode,
} from "@/lib/game/modes";

export function PlayHub({ initialMode }: { initialMode: GameMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<GameMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
    savePreferredGameMode(initialMode);
  }, [initialMode]);

  const dateParam = resolveChallengeDateParam(searchParams);

  function selectMode(next: GameMode) {
    setMode(next);
    savePreferredGameMode(next);
    const path = gameModePlayPath(next);
    if (next === "guess" && dateParam) {
      router.push(`/?date=${dateParam}`);
      return;
    }
    if (next === "resize" && dateParam) {
      router.push(`/resize-them/?${dateParam}`);
      return;
    }
    router.push(path);
  }

  const meta = GAME_MODES.find((m) => m.id === mode);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2">
        <GameModeTabs mode={mode} onChange={selectMode} />
        {meta ? (
          <p className="text-center text-xs text-muted-foreground">
            {meta.tagline}
          </p>
        ) : null}
      </div>

      {mode === "guess" ? (
        <GameBoard />
      ) : (
        <ScaleBoard date={dateParam} />
      )}
    </div>
  );
}

export function PlayHubSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="mx-auto h-10 w-48" />
      <Skeleton className="mx-auto h-6 w-64" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
