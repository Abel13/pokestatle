import { eq, sql } from "drizzle-orm";
import {
  getPgDb,
  getSqliteDb,
  pgSchema,
  schema,
  usePostgres,
} from "@/lib/db";
import {
  challengeIdFromDate,
  difficultyForDate,
  filterPoolByDifficulty,
  getChallengeDate,
  pickDailyPokemonId,
} from "@/lib/game/daily";
import type { Difficulty, PokemonRecord } from "@/lib/game/types";
import { pokemonPoolCache } from "@/lib/cache";

function parseTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }
  return [];
}

function mapPokemon(row: {
  id: number;
  name: string;
  slug: string;
  generation: number;
  height: number;
  weight: number;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  baseStatTotal: number;
  isLegendary: boolean;
  isMythical: boolean;
  evolvesFrom: number | null;
  evolutionStage: number;
  sprite: string;
  difficulty: string;
  typesJson: unknown;
}): PokemonRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    generation: row.generation,
    height: row.height,
    weight: row.weight,
    hp: row.hp,
    attack: row.attack,
    defense: row.defense,
    specialAttack: row.specialAttack,
    specialDefense: row.specialDefense,
    speed: row.speed,
    baseStatTotal: row.baseStatTotal,
    isLegendary: Boolean(row.isLegendary),
    isMythical: Boolean(row.isMythical),
    evolvesFrom: row.evolvesFrom,
    evolutionStage: row.evolutionStage,
    sprite: row.sprite,
    difficulty: row.difficulty as Difficulty,
    types: parseTypes(row.typesJson),
  };
}

export function getSecretSalt(): string {
  return process.env.SECRET_SALT || "pokestatle-dev-salt-change-me";
}

/**
 * Get cached Pokemon pool for challenge creation
 * Cache expires after 1 hour
 */
export async function getCachedPokemonPool(): Promise<{ id: number; difficulty: Difficulty }[]> {
  const CACHE_KEY = "pokemon-pool";
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  const cached = pokemonPoolCache.get(CACHE_KEY);
  if (cached) return cached;

  if (usePostgres()) {
    const pool = await getPgDb()
      .select({
        id: pgSchema.pokemon.id,
        difficulty: pgSchema.pokemon.difficulty,
      })
      .from(pgSchema.pokemon);
    
    const mappedPool = pool.map((p) => ({ 
      id: p.id, 
      difficulty: p.difficulty as Difficulty 
    }));
    
    pokemonPoolCache.set(CACHE_KEY, mappedPool, CACHE_TTL);
    return mappedPool;
  }

  const pool = getSqliteDb()
    .select({
      id: schema.pokemon.id,
      difficulty: schema.pokemon.difficulty,
    })
    .from(schema.pokemon)
    .all() as { id: number; difficulty: Difficulty }[];

  pokemonPoolCache.set(CACHE_KEY, pool, CACHE_TTL);
  return pool;
}

/**
 * Create a daily challenge for a specific date
 * This should only be called by cron jobs or admin functions
 */
export async function createDailyChallenge(date: string) {
  const pool = await getCachedPokemonPool();

  if (pool.length === 0) {
    throw new Error("Pokemon pool is empty. Run pnpm db:push-supabase or pnpm sync:pokemon.");
  }

  const targetDifficulty = difficultyForDate(date);
  const ids = filterPoolByDifficulty(pool, targetDifficulty);
  const pokemonId = pickDailyPokemonId(date, ids, getSecretSalt());
  const id = challengeIdFromDate(date);

  if (usePostgres()) {
    const db = getPgDb();
    await db
      .insert(pgSchema.dailyChallenges)
      .values({
        id,
        date,
        pokemonId,
        difficulty: targetDifficulty,
      })
      .onConflictDoNothing();

    const created = await db
      .select()
      .from(pgSchema.dailyChallenges)
      .where(eq(pgSchema.dailyChallenges.date, date))
      .limit(1);

    if (!created[0]) {
      throw new Error("Failed to materialize daily challenge.");
    }
    return created[0];
  }

  const db = getSqliteDb();
  db.insert(schema.dailyChallenges)
    .values({
      id,
      date,
      pokemonId,
      difficulty: targetDifficulty,
    })
    .onConflictDoNothing()
    .run();

  const created = db
    .select()
    .from(schema.dailyChallenges)
    .where(eq(schema.dailyChallenges.date, date))
    .get();

  if (!created) {
    throw new Error("Failed to materialize daily challenge.");
  }
  return created;
}

/**
 * Get a challenge by date (does not create if missing)
 * Returns null if challenge doesn't exist
 */
export async function getChallenge(date: string) {
  if (usePostgres()) {
    const db = getPgDb();
    const existing = await db
      .select()
      .from(pgSchema.dailyChallenges)
      .where(eq(pgSchema.dailyChallenges.date, date))
      .limit(1);
    return existing[0] || null;
  }

  const db = getSqliteDb();
  const existing = db
    .select()
    .from(schema.dailyChallenges)
    .where(eq(schema.dailyChallenges.date, date))
    .get();
  return existing || null;
}

export async function listPoolPokemon(): Promise<PokemonRecord[]> {
  if (usePostgres()) {
    const rows = await getPgDb().select().from(pgSchema.pokemon);
    return rows.map(mapPokemon);
  }
  return getSqliteDb().select().from(schema.pokemon).all().map(mapPokemon);
}

export async function getPokemonById(
  id: number,
): Promise<PokemonRecord | null> {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select()
      .from(pgSchema.pokemon)
      .where(eq(pgSchema.pokemon.id, id))
      .limit(1);
    return rows[0] ? mapPokemon(rows[0]) : null;
  }
  const row = getSqliteDb()
    .select()
    .from(schema.pokemon)
    .where(eq(schema.pokemon.id, id))
    .get();
  return row ? mapPokemon(row) : null;
}

export async function searchPokemon(query: string, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pattern = `%${q}%`;

  if (usePostgres()) {
    const rows = await getPgDb()
      .select()
      .from(pgSchema.pokemon)
      .where(
        sql`lower(${pgSchema.pokemon.name}) like ${pattern} or lower(${pgSchema.pokemon.slug}) like ${pattern}`,
      )
      .limit(limit);
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      sprite: p.sprite,
      types: parseTypes(p.typesJson),
    }));
  }

  const rows = getSqliteDb()
    .select()
    .from(schema.pokemon)
    .where(
      sql`lower(${schema.pokemon.name}) like ${pattern} or lower(${schema.pokemon.slug}) like ${pattern}`,
    )
    .limit(limit)
    .all();
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    sprite: p.sprite,
    types: parseTypes(p.typesJson),
  }));
}

/**
 * Legacy function for backwards compatibility
 * Tries to get challenge, creates if missing (for today only)
 * New code should use getChallenge() or createDailyChallenge() directly
 */
export async function getOrCreateTodayChallenge(date = getChallengeDate()) {
  const existing = await getChallenge(date);
  if (existing) return existing;

  // Only auto-create for today's date as fallback
  const today = getChallengeDate();
  if (date !== today) {
    throw new Error(`Challenge for ${date} does not exist. Historical challenges must be pre-created.`);
  }

  // Fallback: create today's challenge if missing
  return await createDailyChallenge(date);
}

export async function getPoolSize(): Promise<number> {
  if (usePostgres()) {
    const result = await getPgDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(pgSchema.pokemon);
    return result[0]?.count || 0;
  }
  return getSqliteDb().select().from(schema.pokemon).all().length;
}
