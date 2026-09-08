import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", [
  "EASY",
  "NORMAL",
  "HARD",
  "EXPERT",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "PLAYING",
  "WON",
  "LOST",
]);

export const pokemon = pgTable("pokemon", {
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
  isLegendary: boolean("is_legendary").notNull().default(false),
  isMythical: boolean("is_mythical").notNull().default(false),
  evolvesFrom: integer("evolves_from"),
  evolutionStage: integer("evolution_stage").notNull().default(1),
  sprite: text("sprite").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("NORMAL"),
  typesJson: jsonb("types_json").notNull().$type<string[]>().default([]),
});

export const dailyChallenges = pgTable(
  "daily_challenges",
  {
    id: integer("id").primaryKey(),
    date: date("date").notNull(),
    pokemonId: integer("pokemon_id")
      .notNull()
      .references(() => pokemon.id),
    difficulty: difficultyEnum("difficulty").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("daily_challenges_date_idx").on(table.date)],
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const games = pgTable(
  "games",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => dailyChallenges.id),
    status: gameStatusEnum("status").notNull(),
    guessesJson: jsonb("guesses_json").notNull().$type<number[]>().default([]),
    resultsJson: jsonb("results_json").notNull().$type<unknown[]>().default([]),
    score: integer("score"),
    grade: text("grade"),
    efficiency: integer("efficiency"),
    accuracy: integer("accuracy"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("games_user_challenge_idx").on(table.userId, table.challengeId),
  ],
);

export const userStats = pgTable("user_stats", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  played: integer("played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  distributionJson: jsonb("distribution_json")
    .notNull()
    .$type<number[]>()
    .default([0, 0, 0, 0, 0, 0]),
  lastChallengeId: integer("last_challenge_id"),
});

export const pgSchema = {
  pokemon,
  dailyChallenges,
  profiles,
  games,
  userStats,
};
