"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GameModeTabs } from "@/components/game/game-mode-tabs";
import {
  type GameMode,
  loadPreferredGameMode,
  savePreferredGameMode,
} from "@/lib/game/modes";

export function usePageGameMode(): {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  ModeTabs: () => ReactNode;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams?.get("mode");
  const [mode, setModeState] = useState<GameMode>(
    param === "resize" || param === "guess" ? param : "guess",
  );

  useEffect(() => {
    if (param === "resize" || param === "guess") {
      setModeState(param);
      savePreferredGameMode(param);
      return;
    }
    const preferred = loadPreferredGameMode();
    setModeState(preferred);
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (qs.get("mode") === preferred) return;
    qs.set("mode", preferred);
    router.replace(`${pathname}?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once from URL/preference
  }, [param, pathname]);

  const setMode = useCallback(
    (next: GameMode) => {
      setModeState(next);
      savePreferredGameMode(next);
      const qs = new URLSearchParams(searchParams?.toString() ?? "");
      qs.set("mode", next);
      router.replace(`${pathname}?${qs.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const ModeTabs = useCallback(
    () => <GameModeTabs mode={mode} onChange={setMode} />,
    [mode, setMode],
  );

  return { mode, setMode, ModeTabs };
}
