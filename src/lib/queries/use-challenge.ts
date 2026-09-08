"use client";

import { useQuery } from "@tanstack/react-query";
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
 * Hook to fetch challenge data with React Query
 */
export function useChallenge(date?: string | null) {
  return useQuery<ChallengeData>({
    queryKey: ["challenge", date || "today"],
    queryFn: async () => {
      const endpoint = date 
        ? `/api/challenges/${date}`
        : "/api/challenges/today";
      
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to load challenge");
      }
      
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch game state with React Query
 */
export function useGameState(date?: string | null) {
  return useQuery<GameData>({
    queryKey: ["game", date || "today"],
    queryFn: async () => {
      const endpoint = date
        ? `/api/me/today-game?date=${date}`
        : "/api/me/today-game";
      
      const res = await fetch(endpoint);
      
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
