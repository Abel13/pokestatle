/**
 * Sprite URLs via jsDelivr CDN (more reliable than raw.githubusercontent.com).
 *
 * Prefer generating from Pokémon ID — stored DB URLs may lag behind CDN migrations.
 */

const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master";
const GITHUB_PREFIX =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master";

/**
 * Canonical sprite URL for a Pokémon ID (official artwork by default).
 */
export function getSpriteUrl(pokemonId: number, artwork = true): string {
  if (artwork) {
    return `${JSDELIVR_BASE}/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
  return `${JSDELIVR_BASE}/sprites/pokemon/${pokemonId}.png`;
}

/**
 * Always resolve a display URL from the Pokémon ID.
 * Ignores stale/empty/GitHub URLs left in the database.
 */
export function resolveSpriteUrl(
  pokemonId: number,
  _stored?: string | null,
): string {
  return getSpriteUrl(pokemonId);
}

/**
 * Convert a stored GitHub raw URL to jsDelivr (for DB backfill scripts).
 */
export function convertGitHubUrlToJsDelivr(url: string): string {
  if (!url) return "";
  if (url.includes("cdn.jsdelivr.net")) return url;
  return url.replace(GITHUB_PREFIX, JSDELIVR_BASE);
}

export const SPRITE_URL_PREFIXES = {
  github: GITHUB_PREFIX,
  jsdelivr: JSDELIVR_BASE,
} as const;
