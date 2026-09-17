import { extractDominantColors } from "./dominant-colors";
import { computeEvolutionMeta } from "../../src/lib/pokemon/evolution";
import { getSpriteUrl } from "../../src/lib/pokemon/sprite-url";

export type HintSourceRow = {
  id: number;
  evolvesFrom: number | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export type HintFieldUpdate = {
  id: number;
  evolutionStage: number;
  evolutionLineLength: number;
  primaryColor: string | null;
  secondaryColor: string | null;
};

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
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function colorsFor(id: number): Promise<{
  primary: string;
  secondary: string;
} | null> {
  const url = getSpriteUrl(id);
  const res = await fetch(url, {
    headers: { "User-Agent": "pokestatle-sync/1.0" },
  });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return extractDominantColors(buffer);
}

export async function buildHintFieldUpdates(
  rows: HintSourceRow[],
  options: { concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<HintFieldUpdate[]> {
  const concurrency = options.concurrency ?? 10;
  const meta = computeEvolutionMeta(rows);
  const missing = rows.filter((row) => !row.primaryColor || !row.secondaryColor);
  const fetched = new Map<number, { primary: string; secondary: string }>();

  if (missing.length > 0) {
    let done = 0;
    await mapPool(missing, concurrency, async (row) => {
      try {
        const colors = await colorsFor(row.id);
        if (colors) fetched.set(row.id, colors);
      } catch (err) {
        console.warn(`Color extract failed for #${row.id}:`, err);
      } finally {
        done += 1;
        options.onProgress?.(done, missing.length);
      }
    });
  }

  return rows.map((row) => {
    const evo = meta.get(row.id) ?? { stage: 1, lineLength: 1 };
    const colors = fetched.get(row.id);
    return {
      id: row.id,
      evolutionStage: evo.stage,
      evolutionLineLength: evo.lineLength,
      primaryColor: colors?.primary ?? row.primaryColor ?? null,
      secondaryColor: colors?.secondary ?? row.secondaryColor ?? null,
    };
  });
}
