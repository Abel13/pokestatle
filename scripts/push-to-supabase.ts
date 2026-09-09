/**
 * Apply Supabase schema + seed Pokémon catalog.
 *
 * Prefers data/pokemon.seed.json (no native deps) so Vercel builds stay reliable.
 * Env: DATABASE_URL | POSTGRES_URL | STORAGE_POSTGRES_URL | …
 *
 *   pnpm db:push-supabase
 *   FORCE_DB_PUSH=1 pnpm db:push-supabase
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { getDatabaseUrl } from "../src/lib/db";
import { convertGitHubUrlToJsDelivr } from "../src/lib/pokemon/sprite-url";

const GITHUB_SPRITE_PREFIX =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master";
const JSDELIVR_SPRITE_PREFIX =
  "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master";

async function migrateSpriteUrls(
  sql: postgres.Sql,
): Promise<{ updated: number; remaining: number }> {
  const result = await sql`
    update public.pokemon
    set sprite = replace(sprite, ${GITHUB_SPRITE_PREFIX}, ${JSDELIVR_SPRITE_PREFIX})
    where sprite like ${GITHUB_SPRITE_PREFIX + "%"}
  `;
  const remaining = await sql`
    select count(*)::int as n
    from public.pokemon
    where sprite like ${GITHUB_SPRITE_PREFIX + "%"}
  `;
  return {
    updated: result.count,
    remaining: remaining[0]?.n ?? 0,
  };
}

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
  is_legendary: number | boolean;
  is_mythical: number | boolean;
  evolves_from: number | null;
  evolution_stage: number;
  sprite: string;
  difficulty: string;
  types_json: string | string[];
};

function loadSeedRows(): PokemonSeedRow[] {
  const jsonPath = path.join(process.cwd(), "data/pokemon.seed.json");
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8")) as PokemonSeedRow[];
  }
  throw new Error(
    "Missing data/pokemon.seed.json — regenerate with local SQLite export.",
  );
}

function parseTypes(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

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

  const isLocal =
    url.includes("127.0.0.1") ||
    url.includes("localhost") ||
    url.includes("@db:");

  const sql = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: isLocal ? false : "require",
  });

  console.log("[db:push] Applying schema migrations...");
  await sql.unsafe(fs.readFileSync(migrationPath, "utf8"));
  if (fs.existsSync(triggerPath)) {
    await sql.unsafe(fs.readFileSync(triggerPath, "utf8"));
  }

  const rows = loadSeedRows();
  const existing = await sql`select count(*)::int as n from public.pokemon`;
  const existingCount = existing[0]?.n ?? 0;

  if (!force && existingCount >= rows.length) {
    console.log(
      `[db:push] Catalog already has ${existingCount} rows — skipping seed (set FORCE_DB_PUSH=1 to refresh).`,
    );
  } else {
    console.log(`[db:push] Seeding ${rows.length} Pokémon from pokemon.seed.json...`);

    const chunkSize = 40;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (row) => {
          const types = parseTypes(row.types_json);
          const sprite = convertGitHubUrlToJsDelivr(row.sprite);
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
              ${row.evolution_stage}, ${sprite}, ${row.difficulty}::public.difficulty, ${sql.json(types)}
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
  }

  // Always backfill GitHub → jsDelivr even when seed is skipped (production already full).
  console.log("[db:push] Migrating sprite URLs to jsDelivr CDN...");
  const migration = await migrateSpriteUrls(sql);
  console.log(
    `[db:push] Sprite migration: updated=${migration.updated} remaining_github=${migration.remaining}`,
  );

  const count = await sql`select count(*)::int as n from public.pokemon`;
  console.log(`[db:push] Done. public.pokemon rows = ${count[0]?.n ?? 0}`);
  await sql.end();
}

main().catch(async (err) => {
  console.error("[db:push] Failed:", err);
  process.exit(1);
});
