"use client";

import { useQuery } from "@tanstack/react-query";
import { getChallengeDate } from "@/lib/game/challenge-calendar";
import type { GuessResult, GameStatus } from "@/lib/game/types";

interface ChallengeData {
  id: number;
  date: string;
  maxGuesses: number;
  pokemonPoolSize: number;
  difficulty: string;
}

interface GameData {
  game: {
    challengeId: number;
    status: GameStatus;
    guesses: number[];
    results: GuessResult[];
    completedAt?: string;
  } | null;
}

/**
 * Hook to fetch challenge data with React Query.
 * Always hits the date-specific URL so CDN cache cannot serve yesterday as "today".
 */
export function useChallenge(date?: string | null) {
  const resolvedDate = date || getChallengeDate();

  return useQuery<ChallengeData>({
    queryKey: ["challenge", resolvedDate],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/${resolvedDate}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to load challenge");
      }

      const data = (await res.json()) as ChallengeData;
      if (data.date !== resolvedDate) {
        throw new Error(
          `Challenge date mismatch: expected ${resolvedDate}, got ${data.date}`,
        );
      }
      return data;
    },
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch game state with React Query
 */
export function useGameState(date?: string | null) {
  const resolvedDate = date || getChallengeDate();

  return useQuery<GameData>({
    queryKey: ["game", resolvedDate],
    queryFn: async () => {
      const res = await fetch(`/api/me/today-game?date=${resolvedDate}`);

      if (!res.ok) {
        // Game not found is not an error - just means user hasn't played yet
        if (res.status === 404) {
          return { game: null };
        }
        throw new Error("Failed to load game state");
      }

      return res.json();
    },
    staleTime: 0, // Always fetch fresh game state
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
  });
}
