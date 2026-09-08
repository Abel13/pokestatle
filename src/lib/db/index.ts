import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import * as sqliteSchema from "./schema";
import { pgSchema } from "./schema-pg";

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

/** Writable dir: /tmp on Vercel (read-only /var/task), local ./data otherwise. */
const DATA_DIR = isServerless
  ? path.join("/tmp", "pokestatle")
  : path.join(process.cwd(), "data");

const DB_PATH = path.join(DATA_DIR, "pokestatle.db");
const SEED_PATH = path.join(process.cwd(), "data", "pokestatle.seed.db");

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Build a URI from discrete POSTGRES_* parts (Vercel/Supabase integration). */
function urlFromPostgresParts(prefix = ""): string | undefined {
  const user = firstEnv(`${prefix}POSTGRES_USER`);
  const password = firstEnv(`${prefix}POSTGRES_PASSWORD`);
  const host = firstEnv(`${prefix}POSTGRES_HOST`);
  const database = firstEnv(`${prefix}POSTGRES_DATABASE`) || "postgres";
  if (!user || !password || !host) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:5432/${database}`;
}

/**
 * Resolve the Postgres connection string across common Vercel / Supabase names.
 * Also supports a custom integration prefix like STORAGE_*.
 */
export function getDatabaseUrl(): string | undefined {
  return (
    firstEnv(
      "DATABASE_URL",
      "POSTGRES_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL_NON_POOLING",
      "SUPABASE_DB_URL",
      // Custom prefix used by some Supabase↔Vercel integrations
      "STORAGE_DATABASE_URL",
      "STORAGE_POSTGRES_URL",
      "STORAGE_POSTGRES_PRISMA_URL",
      "STORAGE_POSTGRES_URL_NON_POOLING",
    ) ||
    urlFromPostgresParts() ||
    urlFromPostgresParts("STORAGE_") ||
    undefined
  );
}

export function usePostgres(): boolean {
  return Boolean(getDatabaseUrl());
}

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
  }
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

type SqliteDb = ReturnType<typeof drizzleSqlite<typeof sqliteSchema>>;
type PgDb = ReturnType<typeof drizzlePg<typeof pgSchema>>;

let sqliteCached: SqliteDb | null = null;
let pgCached: PgDb | null = null;
let pgSql: ReturnType<typeof postgres> | null = null;

export function getSqliteDb(): SqliteDb {
  if (sqliteCached) return sqliteCached;
  ensureSeededDatabase();
  const sqlite = new Database(DB_PATH);
  sqlite.pragma(isServerless ? "journal_mode = DELETE" : "journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  sqliteCached = drizzleSqlite(sqlite, { schema: sqliteSchema });
  return sqliteCached;
}

export function getPgDb(): PgDb {
  if (pgCached) return pgCached;
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Postgres requested but no URL found (DATABASE_URL / POSTGRES_URL / STORAGE_POSTGRES_URL).",
    );
  }
  pgSql = postgres(url, {
    prepare: false,
    max: isServerless ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 30,
  });
  pgCached = drizzlePg(pgSql, { schema: pgSchema });
  return pgCached;
}

/** @deprecated Prefer getSqliteDb / getPgDb / usePostgres(). Kept for local scripts. */
export function getDb() {
  if (usePostgres()) return getPgDb();
  return getSqliteDb();
}

export function getSqlite() {
  getSqliteDb();
  return new Database(DB_PATH);
}

export { sqliteSchema as schema, pgSchema, SEED_PATH, DB_PATH };
