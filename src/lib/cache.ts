/**
 * Simple in-memory cache with TTL support
 * Suitable for serverless environments where each instance manages its own cache
 */

export interface CacheEntry<T> {
  data: T;
  expires: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/** Cached today-challenge payload (public fields only). */
export type TodayChallengeCached = {
  id: number;
  date: string;
  difficulty: string;
  pokemonPoolSize: number;
  pokemonId?: number;
};

// Global cache instances
export const todayChallengeCache = new MemoryCache<TodayChallengeCached>();

export const pokemonPoolCache = new MemoryCache<
  {
    id: number;
    difficulty: "EASY" | "NORMAL" | "HARD" | "EXPERT";
  }[]
>();

export const poolSizeCache = new MemoryCache<number>();
