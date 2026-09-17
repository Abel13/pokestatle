import { PNG } from "pngjs";

const STEP = 24;
const MIN_CHANNEL_DISTANCE = 48;

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function distance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Two dominant colors from official artwork. Skips transparent and near-white
 * background pixels. Sync-script only — not imported by the Next.js runtime.
 */
export function extractDominantColors(
  buffer: Buffer,
): { primary: string; secondary: string } | null {
  let png: PNG;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    return null;
  }

  const buckets = new Map<
    string,
    { r: number; g: number; b: number; count: number }
  >();
  const stride = png.width * png.height > 80_000 ? 16 : 8;

  for (let i = 0; i < png.data.length; i += stride) {
    const r = png.data[i]!;
    const g = png.data[i + 1]!;
    const b = png.data[i + 2]!;
    const a = png.data[i + 3]!;
    if (a < 128) continue;
    if (r > 245 && g > 245 && b > 245) continue;
    if (r < 12 && g < 12 && b < 12) continue;

    const qr = Math.round(r / STEP) * STEP;
    const qg = Math.round(g / STEP) * STEP;
    const qb = Math.round(b / STEP) * STEP;
    const key = `${qr},${qg},${qb}`;
    const existing = buckets.get(key);
    if (existing) existing.count += 1;
    else buckets.set(key, { r: qr, g: qg, b: qb, count: 1 });
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const primary = sorted[0];
  if (!primary) return null;

  const secondary =
    sorted.find((c) => distance(c, primary) >= MIN_CHANNEL_DISTANCE) ??
    sorted[1] ??
    primary;

  return {
    primary: toHex(primary.r, primary.g, primary.b),
    secondary: toHex(secondary.r, secondary.g, secondary.b),
  };
}
