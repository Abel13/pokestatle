import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

/** Writable dir: /tmp on Vercel (read-only /var/task), local ./data otherwise. */
const DATA_DIR = isServerless
  ? path.join("/tmp", "pokestatle")
  : path.join(process.cwd(), "data");

const DB_PATH = path.join(DATA_DIR, "pokestatle.db");
const SEED_PATH = path.join(process.cwd(), "data", "pokestatle.seed.db");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureSeededDatabase() {
  ensureDataDir();
  if (fs.existsSync(DB_PATH)) return;

  if (fs.existsSync(SEED_PATH)) {
    fs.copyFileSync(SEED_PATH, DB_PATH);
    return;
  }

  // Empty DB — schema will be applied; sync:pokemon still needed for local empty installs.
}

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      generation INTEGER NOT NULL,
      height INTEGER NOT NULL,
      weight INTEGER NOT NULL,
      hp INTEGER NOT NULL,
      attack INTEGER NOT NULL,
      defense INTEGER NOT NULL,
      special_attack INTEGER NOT NULL,
      special_defense INTEGER NOT NULL,
      speed INTEGER NOT NULL,
      base_stat_total INTEGER NOT NULL,
      is_legendary INTEGER NOT NULL DEFAULT 0,
      is_mythical INTEGER NOT NULL DEFAULT 0,
      evolves_from INTEGER,
      evolution_stage INTEGER NOT NULL DEFAULT 1,
      sprite TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'NORMAL',
      types_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      difficulty TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES profiles(id),
      challenge_id INTEGER NOT NULL REFERENCES daily_challenges(id),
      status TEXT NOT NULL,
      guesses_json TEXT NOT NULL DEFAULT '[]',
      results_json TEXT NOT NULL DEFAULT '[]',
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY REFERENCES profiles(id),
      played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      max_streak INTEGER NOT NULL DEFAULT 0,
      distribution_json TEXT NOT NULL DEFAULT '[0,0,0,0,0,0]',
      last_challenge_id INTEGER
    );
  `);
}

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (cached) return cached;
  ensureSeededDatabase();
  const sqlite = new Database(DB_PATH);
  // DELETE is safer than WAL on ephemeral /tmp (serverless).
  sqlite.pragma(isServerless ? "journal_mode = DELETE" : "journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  cached = drizzle(sqlite, { schema });
  return cached;
}

export function getSqlite() {
  getDb();
  return new Database(DB_PATH);
}

export { schema };
