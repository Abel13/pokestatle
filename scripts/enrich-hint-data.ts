/**
 * Backfill evolution line + dominant artwork colors on the seed catalog.
 *
 *   pnpm sync:hints
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getSqliteDb, schema } from "../src/lib/db";
import { buildHintFieldUpdates } from "./lib/apply-hint-fields";

type SeedRow = {
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
  evolution_line_length?: number;
  sprite: string;
  difficulty: string;
  types_json: string | string[];
  primary_color?: string | null;
  secondary_color?: string | null;
};

const SEED_PATH = path.join(process.cwd(), "data/pokemon.seed.json");

function writeSeed(rows: SeedRow[]) {
  fs.writeFileSync(SEED_PATH, JSON.stringify(rows));
}

async function main() {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error("Missing data/pokemon.seed.json");
  }

  const rows = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as SeedRow[];
  console.log(`Enriching ${rows.length} Pokémon with evolution + colors...`);

  const updates = await buildHintFieldUpdates(
    rows.map((row) => ({
      id: row.id,
      evolvesFrom: row.evolves_from,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
    })),
    {
      concurrency: 12,
      onProgress: (done, total) => {
        if (done % 50 === 0 || done === total) {
          console.log(`  colors ${done}/${total}`);
        }
      },
    },
  );

  const byId = new Map(updates.map((u) => [u.id, u]));
  const next = rows.map((row) => {
    const u = byId.get(row.id);
    return {
      ...row,
      evolution_stage: u?.evolutionStage ?? row.evolution_stage,
      evolution_line_length: u?.evolutionLineLength ?? 1,
      primary_color: u?.primaryColor ?? null,
      secondary_color: u?.secondaryColor ?? null,
    };
  });

  writeSeed(next);
  console.log(`Wrote ${SEED_PATH}`);

  const db = getSqliteDb();
  for (const u of updates) {
    db.update(schema.pokemon)
      .set({
        evolutionStage: u.evolutionStage,
        evolutionLineLength: u.evolutionLineLength,
        primaryColor: u.primaryColor,
        secondaryColor: u.secondaryColor,
      })
      .where(eq(schema.pokemon.id, u.id))
      .run();
  }
  console.log(`Updated SQLite catalog (${updates.length} rows)`);

  const withColors = next.filter((r) => r.primary_color).length;
  console.log(`Done. colors=${withColors}/${next.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
