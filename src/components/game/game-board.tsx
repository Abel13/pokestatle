"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { GuessCards } from "@/components/game/guess-cards";
import { PokemonSearch } from "@/components/game/pokemon-search";
import { ResultModal } from "@/components/game/result-modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameState, GuessResult } from "@/lib/game/types";
import { MAX_GUESSES } from "@/lib/game/types";
import {
  loadGameState,
  saveGameState,
  updateLocalStatsOnComplete,
} from "@/lib/storage";

type ChallengeMeta = {
  id: number;
  date: string;
  maxGuesses: number;
  pokemonPoolSize: number;
  difficulty: string;
};

export function GameBoard() {
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get("date");
  const [challenge, setChallenge] = useState<ChallengeMeta | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        setLoading(true);
        
        // Use date parameter or default to today
        const challengeEndpoint = dateParam 
          ? `/api/challenges/${dateParam}`
          : "/api/challenges/today";
        
        const res = await fetch(challengeEndpoint);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load challenge");
        if (cancelled) return;
        setChallenge(data);

        // Try to load from server first (for logged-in users)
        let serverGame: GameState | null = null;
        try {
          const gameEndpoint = dateParam
            ? `/api/me/today-game?date=${dateParam}`
            : "/api/me/today-game";
          const gameRes = await fetch(gameEndpoint);
          const gameData = await gameRes.json();
          if (gameData.game) {
            serverGame = {
              challengeId: gameData.game.challengeId,
              date: data.date,
              guesses: gameData.game.guesses,
              results: gameData.game.results,
              status: gameData.game.status,
              completedAt: gameData.game.completedAt,
            };
          }
        } catch {
          // Not logged in or server error, continue with localStorage
        }

        // Use server state if available, otherwise fallback to localStorage
        const saved = serverGame || loadGameState(data.date);
        
        if (saved && saved.challengeId === data.id) {
          setState(saved);
          saveGameState(saved); // Sync server state to localStorage
          if (saved.status !== "PLAYING") setModalOpen(true);
        } else {
          const fresh: GameState = {
            challengeId: data.id,
            date: data.date,
            guesses: [],
            results: [],
            status: "PLAYING",
          };
          setState(fresh);
          saveGameState(fresh);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [dateParam]);

  const remaining = useMemo(() => {
    if (!state) return MAX_GUESSES;
    return MAX_GUESSES - state.guesses.length;
  }, [state]);

  const onSelect = useCallback(
    async (pokemon: { id: number; name: string; sprite: string }) => {
      if (!state || !challenge || state.status !== "PLAYING" || submitting) {
        return;
      }
      
      // Additional check: prevent submitting if max guesses reached
      if (state.guesses.length >= MAX_GUESSES) {
        setError("No guesses remaining.");
        return;
      }
      
      setSubmitting(true);
      setError(null);
      try {
        const guessEndpoint = dateParam
          ? `/api/challenges/${dateParam}/guess`
          : "/api/challenges/today/guess";
        const res = await fetch(guessEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pokemonId: pokemon.id,
            previousGuesses: state.guesses,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Guess failed");

        const result: GuessResult = {
          pokemonId: data.result.pokemonId ?? data.result.pokemon.id,
          name: data.result.name ?? data.result.pokemon.name,
          sprite: data.result.sprite ?? data.result.pokemon.sprite,
          isCorrect: data.isCorrect,
          attributes: data.result.attributes ?? {
            generation: data.result.generation,
            types: data.result.types,
            height: data.result.height,
            weight: data.result.weight,
            hp: data.result.hp,
            attack: data.result.attack,
            defense: data.result.defense,
            specialAttack: data.result.specialAttack,
            specialDefense: data.result.specialDefense,
            speed: data.result.speed,
          },
        };

        const next: GameState = {
          ...state,
          guesses: data.guesses,
          results: [...state.results, result],
          status: data.status,
          completedAt:
            data.status === "PLAYING" ? undefined : new Date().toISOString(),
          revealedPokemon: data.revealedPokemon,
        };
        setState(next);
        saveGameState(next);

        if (next.status !== "PLAYING") {
          updateLocalStatsOnComplete({
            challengeId: next.challengeId,
            won: next.status === "WON",
            guessCount: next.guesses.length,
          });
          setModalOpen(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Guess failed");
      } finally {
        setSubmitting(false);
      }
    },
    [state, challenge, submitting, dateParam],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="mx-auto h-10 w-64" />
        <Skeleton className="mx-auto h-6 w-80" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm">{error}</p>
        <p className="text-xs text-muted-foreground">
          If the pool is empty, run <code className="rounded bg-muted px-1">pnpm sync:pokemon</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-teal-500/10 via-background to-sky-500/10 px-4 py-6 text-center shadow-sm sm:rounded-3xl sm:px-6 sm:py-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_55%)]" />
        <div className="relative space-y-2 sm:space-y-3">
          <div className="flex justify-center">
            <LogoMark className="size-12 sm:size-14" />
          </div>
          <p className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            PokéStatle
            {challenge ? (
              <span className="ml-1.5 text-teal-700 sm:ml-2 dark:text-teal-300">
                #{challenge.id}
              </span>
            ) : null}
          </p>
          <p className="mx-auto max-w-md text-xs text-muted-foreground sm:text-base">
            Discover today&apos;s Pokémon in {MAX_GUESSES} guesses. Everyone gets
            the same challenge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
            {challenge ? (
              <>
                <Badge variant="secondary">{challenge.date}</Badge>
                <Badge variant="outline">{challenge.difficulty}</Badge>
                <Badge variant="outline">
                  Pool {challenge.pokemonPoolSize}
                </Badge>
                <Badge variant="outline">{remaining} left</Badge>
              </>
            ) : null}
          </div>
        </div>
      </motion.section>

      <div className="space-y-3">
        <PokemonSearch
          disabled={
            submitting || !state || state.status !== "PLAYING" || remaining <= 0
          }
          excludeIds={state?.guesses ?? []}
          onSelect={onSelect}
        />
        {submitting ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Comparing attributes...
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      <GuessCards results={state?.results ?? []} />

      {state && challenge ? (
        <ResultModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          won={state.status === "WON"}
          challengeId={challenge.id}
          results={state.results}
          revealed={state.revealedPokemon}
        />
      ) : null}

      {state && state.status !== "PLAYING" ? (
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
            onClick={() => setModalOpen(true)}
          >
            View result & share
          </button>
        </div>
      ) : null}
    </div>
  );
}
