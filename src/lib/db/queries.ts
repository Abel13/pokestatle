import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  challengeIdFromDate,
  difficultyForDate,
  filterPoolByDifficulty,
  getChallengeDate,
  pickDailyPokemonId,
} from "@/lib/game/daily";
import type { Difficulty, PokemonRecord } from "@/lib/game/types";

function mapPokemon(row: typeof schema.pokemon.$inferSelect): PokemonRecord {
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
    isLegendary: row.isLegendary,
    isMythical: row.isMythical,
    evolvesFrom: row.evolvesFrom,
    evolutionStage: row.evolutionStage,
    sprite: row.sprite,
    difficulty: row.difficulty as Difficulty,
    types: JSON.parse(row.typesJson) as string[],
  };
}

export function getSecretSalt(): string {
  return process.env.SECRET_SALT || "pokestatle-dev-salt-change-me";
}

export function listPoolPokemon(): PokemonRecord[] {
  const db = getDb();
  return db.select().from(schema.pokemon).all().map(mapPokemon);
}

export function getPokemonById(id: number): PokemonRecord | null {
  const db = getDb();
  const row = db
    .select()
    .from(schema.pokemon)
    .where(eq(schema.pokemon.id, id))
    .get();
  return row ? mapPokemon(row) : null;
}

export function searchPokemon(query: string, limit = 12) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const db = getDb();
  const rows = db.select().from(schema.pokemon).all();
  return rows
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    )
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sprite: p.sprite,
      types: JSON.parse(p.typesJson) as string[],
    }));
}

export function getOrCreateTodayChallenge(date = getChallengeDate()) {
  const db = getDb();
  const existing = db
    .select()
    .from(schema.dailyChallenges)
    .where(eq(schema.dailyChallenges.date, date))
    .get();

  if (existing) {
    return existing;
  }

  const pool = db
    .select({
      id: schema.pokemon.id,
      difficulty: schema.pokemon.difficulty,
    })
    .from(schema.pokemon)
    .all() as { id: number; difficulty: Difficulty }[];

  if (pool.length === 0) {
    throw new Error("Pokemon pool is empty. Run pnpm sync:pokemon.");
  }

  const targetDifficulty = difficultyForDate(date);
  const ids = filterPoolByDifficulty(pool, targetDifficulty);
  const pokemonId = pickDailyPokemonId(date, ids, getSecretSalt());
  const id = challengeIdFromDate(date);

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

export function getPoolSize(): number {
  const db = getDb();
  return db.select().from(schema.pokemon).all().length;
}
