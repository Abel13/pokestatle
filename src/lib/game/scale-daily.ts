import { hashSeed } from "./daily";
import {
  assignReferenceTarget,
  isPlayablePair,
} from "./scale-score";
import {
  SCALE_POKEMON_COUNT,
  SCALE_ROUNDS,
  type ScalePair,
} from "./scale-types";

export type ScalePoolEntry = {
  id: number;
  height: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function buildPairsFromTen(ten: ScalePoolEntry[]): ScalePair[] | null {
  if (ten.length < SCALE_POKEMON_COUNT) return null;
  const pairs: ScalePair[] = [];
  for (let i = 0; i < SCALE_ROUNDS; i++) {
    const a = ten[i * 2]!;
    const b = ten[i * 2 + 1]!;
    if (!isPlayablePair(a.height, b.height)) return null;
    pairs.push(assignReferenceTarget(a, b));
  }
  return pairs;
}

/**
 * Deterministically pick 5 playable height-comparison pairs for a date.
 * Soft-filters extreme ratios by reshuffling with derived seeds.
 */
export function pickScalePairs(
  pool: ScalePoolEntry[],
  date: string,
  secretSalt: string,
): ScalePair[] {
  const eligible = pool.filter(
    (p) => Number.isFinite(p.height) && p.height > 0 && Number.isFinite(p.id),
  );
  if (eligible.length < SCALE_POKEMON_COUNT) {
    throw new Error(
      `Scale pool too small (${eligible.length}). Need at least ${SCALE_POKEMON_COUNT} Pokémon.`,
    );
  }

  const maxAttempts = 80;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seed = hashSeed(`scale:${date}:${secretSalt}:${attempt}`);
    const shuffled = shuffle(eligible, seed);
    const ten = shuffled.slice(0, SCALE_POKEMON_COUNT);
    const pairs = buildPairsFromTen(ten);
    if (pairs) return pairs;
  }

  // Fallback: accept first 10 from primary seed even if ratios are awkward
  const seed = hashSeed(`scale:${date}:${secretSalt}:fallback`);
  const shuffled = shuffle(eligible, seed);
  const ten = shuffled.slice(0, SCALE_POKEMON_COUNT);
  const pairs: ScalePair[] = [];
  for (let i = 0; i < SCALE_ROUNDS; i++) {
    pairs.push(assignReferenceTarget(ten[i * 2]!, ten[i * 2 + 1]!));
  }
  return pairs;
}
