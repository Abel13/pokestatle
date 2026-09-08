import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const pokemon = sqliteTable("pokemon", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  generation: integer("generation").notNull(),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  hp: integer("hp").notNull(),
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  specialAttack: integer("special_attack").notNull(),
  specialDefense: integer("special_defense").notNull(),
  speed: integer("speed").notNull(),
  baseStatTotal: integer("base_stat_total").notNull(),
  isLegendary: integer("is_legendary", { mode: "boolean" }).notNull().default(false),
  isMythical: integer("is_mythical", { mode: "boolean" }).notNull().default(false),
  evolvesFrom: integer("evolves_from"),
  evolutionStage: integer("evolution_stage").notNull().default(1),
  sprite: text("sprite").notNull(),
  difficulty: text("difficulty").notNull().default("NORMAL"),
  typesJson: text("types_json").notNull().default("[]"),
});

export const dailyChallenges = sqliteTable(
  "daily_challenges",
  {
    id: integer("id").primaryKey(),
    date: text("date").notNull(),
    pokemonId: integer("pokemon_id")
      .notNull()
      .references(() => pokemon.id),
    difficulty: text("difficulty").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("daily_challenges_date_idx").on(table.date)],
);

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const games = sqliteTable(
  "games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => dailyChallenges.id),
    status: text("status").notNull(),
    guessesJson: text("guesses_json").notNull().default("[]"),
    resultsJson: text("results_json").notNull().default("[]"),
    score: integer("score"),
    grade: text("grade"),
    efficiency: integer("efficiency"),
    accuracy: integer("accuracy"),
    completedAt: text("completed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("games_user_challenge_idx").on(table.userId, table.challengeId),
  ],
);

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => profiles.id),
  played: integer("played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  distributionJson: text("distribution_json")
    .notNull()
    .default("[0,0,0,0,0,0]"),
  lastChallengeId: integer("last_challenge_id"),
});

export type PokemonRow = typeof pokemon.$inferSelect;
export type DailyChallengeRow = typeof dailyChallenges.$inferSelect;
