/**
 * Apply Supabase schema + seed Pokémon catalog from local SQLite seed.
 *
 * Env (any of): DATABASE_URL, POSTGRES_URL, STORAGE_POSTGRES_URL, …
 * Runs automatically during `pnpm build` on Vercel when a Postgres URL is present.
 *
 *   pnpm db:push-supabase
 *   FORCE_DB_PUSH=1 pnpm db:push-supabase   # re-seed even if catalog looks full
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import postgres from "postgres";
import { getDatabaseUrl, SEED_PATH, DB_PATH } from "../src/lib/db";

type PokemonSeedRow = {
  id: number;
  name: string;
  slug: string;
  generation: number;
  height: number;
  weight: number;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  base_stat_total: number;
  is_legendary: number;
  is_mythical: number;
  evolves_from: number | null;
  evolution_stage: number;
  sprite: string;
  difficulty: string;
  types_json: string;
};

async function main() {
  const url = getDatabaseUrl();
  const onVercel = Boolean(process.env.VERCEL);
  const force = process.env.FORCE_DB_PUSH === "1";

  if (!url) {
    if (onVercel || process.env.CI) {
      console.warn(
        "[db:push] No Postgres URL in this environment — skipping schema/seed (SQLite fallback).",
      );
      process.exit(0);
    }
    console.error(
      "Missing Postgres URL. Set DATABASE_URL, POSTGRES_URL, or STORAGE_POSTGRES_URL.",
    );
    process.exit(1);
  }

  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20260101000000_initial.sql",
  );
  const triggerPath = path.join(
    process.cwd(),
    "supabase/migrations/20260101000001_profile_trigger.sql",
  );

  const sql = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  console.log("[db:push] Applying schema migrations...");
  await sql.unsafe(fs.readFileSync(migrationPath, "utf8"));
  if (fs.existsSync(triggerPath)) {
    await sql.unsafe(fs.readFileSync(triggerPath, "utf8"));
  }

  const localPath = fs.existsSync(SEED_PATH)
    ? SEED_PATH
    : fs.existsSync(DB_PATH)
      ? DB_PATH
      : null;
  if (!localPath) {
    console.error("[db:push] No local seed DB found. Run pnpm sync:pokemon first.");
    await sql.end();
    process.exit(1);
  }

  const sqlite = new Database(localPath, { readonly: true });
  const rows = sqlite
    .prepare("SELECT * FROM pokemon ORDER BY id")
    .all() as PokemonSeedRow[];

  const existing = await sql`select count(*)::int as n from public.pokemon`;
  const existingCount = existing[0]?.n ?? 0;

  if (!force && existingCount >= rows.length) {
    console.log(
      `[db:push] Catalog already has ${existingCount} rows — skipping seed (set FORCE_DB_PUSH=1 to refresh).`,
    );
    sqlite.close();
    await sql.end();
    return;
  }

  console.log(
    `[db:push] Seeding ${rows.length} Pokémon from ${path.basename(localPath)}...`,
  );

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (row) => {
        let types: string[] = [];
        try {
          types = JSON.parse(row.types_json) as string[];
        } catch {
          types = [];
        }

        await sql`
          insert into public.pokemon (
            id, name, slug, generation, height, weight,
            hp, attack, defense, special_attack, special_defense, speed,
            base_stat_total, is_legendary, is_mythical, evolves_from,
            evolution_stage, sprite, difficulty, types_json
          ) values (
            ${row.id}, ${row.name}, ${row.slug}, ${row.generation}, ${row.height}, ${row.weight},
            ${row.hp}, ${row.attack}, ${row.defense}, ${row.special_attack}, ${row.special_defense}, ${row.speed},
            ${row.base_stat_total}, ${Boolean(row.is_legendary)}, ${Boolean(row.is_mythical)}, ${row.evolves_from},
            ${row.evolution_stage}, ${row.sprite}, ${row.difficulty}::public.difficulty, ${sql.json(types)}
          )
          on conflict (id) do update set
            name = excluded.name,
            slug = excluded.slug,
            generation = excluded.generation,
            height = excluded.height,
            weight = excluded.weight,
            hp = excluded.hp,
            attack = excluded.attack,
            defense = excluded.defense,
            special_attack = excluded.special_attack,
            special_defense = excluded.special_defense,
            speed = excluded.speed,
            base_stat_total = excluded.base_stat_total,
            is_legendary = excluded.is_legendary,
            is_mythical = excluded.is_mythical,
            evolves_from = excluded.evolves_from,
            evolution_stage = excluded.evolution_stage,
            sprite = excluded.sprite,
            difficulty = excluded.difficulty,
            types_json = excluded.types_json
        `;
      }),
    );
    console.log(`  … ${Math.min(i + chunkSize, rows.length)}/${rows.length}`);
  }

  const count = await sql`select count(*)::int as n from public.pokemon`;
  console.log(`[db:push] Done. public.pokemon rows = ${count[0]?.n ?? 0}`);
  sqlite.close();
  await sql.end();
}

main().catch(async (err) => {
  console.error("[db:push] Failed:", err);
  process.exit(1);
});
