import "dotenv/config";
import { getSqliteDb, schema } from "../src/lib/db";
import { buildHintFieldUpdates } from "./lib/apply-hint-fields";
import {
  classifyDifficulty,
  isEligibleSlug,
  titleCaseName,
} from "../src/lib/pokemon/difficulty";
import { convertGitHubUrlToJsDelivr } from "../src/lib/pokemon/sprite-url";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

const API = "https://pokeapi.co/api/v2";
const CONCURRENCY = 8;

type Named = { name: string; url: string };

const SPECIES_ALLOW = new Set([
  "nidoran-f",
  "nidoran-m",
  "mr-mime",
  "mime-jr",
  "type-null",
  "jangmo-o",
  "hakamo-o",
  "kommo-o",
  "tapu-koko",
  "tapu-lele",
  "tapu-bulu",
  "tapu-fini",
  "porygon-z",
  "ho-oh",
  "chien-pao",
  "ting-lu",
  "wo-chien",
  "chi-yu",
  "iron-leaves",
  "iron-valiant",
  "walking-wake",
  "great-tusk",
  "scream-tail",
  "brute-bonnet",
  "flutter-mane",
  "slither-wing",
  "sandy-shocks",
  "iron-treads",
  "iron-bundle",
  "iron-hands",
  "iron-jugulis",
  "iron-moth",
  "iron-thorns",
  "roaring-moon",
  "gouging-fire",
  "raging-bolt",
  "iron-boulder",
  "iron-crown",
  "mr-rime",
  "farfetchd",
  "sirfetchd",
  "flabebe",
]);

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": "pokestatle-sync/1.0" },
  });
  if (res.status === 429 && attempt < 5) {
    await new Promise((r) => setTimeout(r, attempt * 500));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

function generationFromUrl(url: string | null | undefined): number {
  if (!url) return 1;
  const match = url.match(/\/generation\/(\d+)\//);
  return match ? Number(match[1]) : 1;
}

function shouldKeepSpecies(name: string): boolean {
  if (SPECIES_ALLOW.has(name)) return true;
  if (/-(mega|gmax|alola|galar|hisui|paldea|totem|cap|cosplay)/.test(name)) {
    return false;
  }
  if (name.includes("-") && !isEligibleSlug(name) && !SPECIES_ALLOW.has(name)) {
    // Keep simple hyphenated species that are default national-dex entries
    return !FORM_REJECT.test(name);
  }
  return true;
}

const FORM_REJECT =
  /-(mega|gmax|gigantamax|alola|galar|hisui|paldea|cosplay|rock-star|belle|pop-star|phd|libre|cap|totem|primal|origin|therian|black|white|resolute|pirouette|blade|school|busted|dawn|ultra|dusk|midnight|low-key|noice|hangry|crowned|eternamax|shadow|hero|bloodmoon|wellspring|hearthflame|cornerstone|teal|stellar)/;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => run()));
  return results;
}

async function main() {
  console.log("Fetching Pokemon species list...");
  const list = await fetchJson<{ count: number; results: Named[] }>(
    `${API}/pokemon-species?limit=2000`,
  );

  const db = getSqliteDb();
  let upserted = 0;
  let skipped = 0;

  await mapPool(list.results, CONCURRENCY, async (item) => {
    try {
      const species = await fetchJson<{
        id: number;
        name: string;
        is_legendary: boolean;
        is_mythical: boolean;
        evolves_from_species: Named | null;
        generation: Named;
        varieties: { is_default: boolean; pokemon: Named }[];
      }>(item.url);

      if (!shouldKeepSpecies(species.name)) {
        skipped++;
        return;
      }

      const defaultVariety =
        species.varieties.find((v) => v.is_default)?.pokemon ??
        species.varieties[0]?.pokemon;
      if (!defaultVariety) {
        skipped++;
        return;
      }

      if (FORM_REJECT.test(defaultVariety.name) && !SPECIES_ALLOW.has(species.name)) {
        skipped++;
        return;
      }

      const pokemon = await fetchJson<{
        id: number;
        name: string;
        height: number;
        weight: number;
        sprites: {
          front_default: string | null;
          other?: {
            "official-artwork"?: { front_default: string | null };
          };
        };
        stats: { base_stat: number; stat: Named }[];
        types: { slot: number; type: Named }[];
      }>(defaultVariety.url);

      const statsMap = Object.fromEntries(
        pokemon.stats.map((s) => [s.stat.name, s.base_stat]),
      );
      const hp = statsMap.hp ?? 0;
      const attack = statsMap.attack ?? 0;
      const defense = statsMap.defense ?? 0;
      const specialAttack = statsMap["special-attack"] ?? 0;
      const specialDefense = statsMap["special-defense"] ?? 0;
      const speed = statsMap.speed ?? 0;
      const baseStatTotal =
        hp + attack + defense + specialAttack + specialDefense + speed;
      const generation = generationFromUrl(species.generation.url);
      const evolvesFrom = species.evolves_from_species
        ? Number(species.evolves_from_species.url.match(/\/(\d+)\/?$/)?.[1])
        : null;
      const difficultyStage = evolvesFrom ? 2 : 1;
      const difficulty = classifyDifficulty({
        generation,
        isLegendary: species.is_legendary,
        isMythical: species.is_mythical,
        baseStatTotal,
        evolutionStage: difficultyStage,
      });
      const sprite = convertGitHubUrlToJsDelivr(
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default ||
        ""
      );
      const types = pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name);

      db.insert(schema.pokemon)
        .values({
          id: species.id,
          name: titleCaseName(species.name),
          slug: species.name,
          generation,
          height: pokemon.height,
          weight: pokemon.weight,
          hp,
          attack,
          defense,
          specialAttack,
          specialDefense,
          speed,
          baseStatTotal,
          isLegendary: species.is_legendary,
          isMythical: species.is_mythical,
          evolvesFrom,
          evolutionStage: difficultyStage,
          evolutionLineLength: 1,
          sprite,
          difficulty,
          typesJson: JSON.stringify(types),
        })
        .onConflictDoUpdate({
          target: schema.pokemon.id,
          set: {
            name: titleCaseName(species.name),
            slug: species.name,
            generation,
            height: pokemon.height,
            weight: pokemon.weight,
            hp,
            attack,
            defense,
            specialAttack,
            specialDefense,
            speed,
            baseStatTotal,
            isLegendary: species.is_legendary,
            isMythical: species.is_mythical,
            evolvesFrom,
            sprite,
            difficulty,
            typesJson: JSON.stringify(types),
          },
        })
        .run();

      upserted++;
      if (upserted % 100 === 0) console.log(`Upserted ${upserted}...`);
    } catch (err) {
      console.warn(`Skip ${item.name}:`, err);
      skipped++;
    }
  });

  console.log(`Done. Upserted=${upserted} skipped=${skipped}`);

  console.log("Computing evolution lines and artwork colors...");
  const catalog = db
    .select({
      id: schema.pokemon.id,
      evolvesFrom: schema.pokemon.evolvesFrom,
      primaryColor: schema.pokemon.primaryColor,
      secondaryColor: schema.pokemon.secondaryColor,
    })
    .from(schema.pokemon)
    .all();
  const updates = await buildHintFieldUpdates(catalog, {
    concurrency: 10,
    onProgress: (done, total) => {
      if (done % 50 === 0 || done === total) {
        console.log(`  colors ${done}/${total}`);
      }
    },
  });
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

  const seedRows = db.select().from(schema.pokemon).all();
  const seedPath = path.join(process.cwd(), "data/pokemon.seed.json");
  fs.writeFileSync(
    seedPath,
    JSON.stringify(
      seedRows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        generation: row.generation,
        height: row.height,
        weight: row.weight,
        hp: row.hp,
        attack: row.attack,
        defense: row.defense,
        special_attack: row.specialAttack,
        special_defense: row.specialDefense,
        speed: row.speed,
        base_stat_total: row.baseStatTotal,
        is_legendary: row.isLegendary ? 1 : 0,
        is_mythical: row.isMythical ? 1 : 0,
        evolves_from: row.evolvesFrom,
        evolution_stage: row.evolutionStage,
        evolution_line_length: row.evolutionLineLength,
        sprite: row.sprite,
        difficulty: row.difficulty,
        types_json: row.typesJson,
        primary_color: row.primaryColor,
        secondary_color: row.secondaryColor,
      })),
    ),
  );
  console.log(`Exported ${seedRows.length} rows to ${seedPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
