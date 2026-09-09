/**
 * Generate sprite URLs using jsDelivr CDN
 * More reliable than raw.githubusercontent.com
 * 
 * jsDelivr provides:
 * - Multi-CDN edge caching
 * - No rate limiting
 * - Global performance
 * - Free for open-source projects
 */

const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master";

/**
 * Generate sprite URL for a Pokemon using jsDelivr CDN
 * @param pokemonId - Pokemon ID number
 * @param artwork - Use official artwork (true) or default sprite (false)
 * @returns Full CDN URL to the sprite
 */
export function getSpriteUrl(pokemonId: number, artwork = true): string {
  if (artwork) {
    return `${JSDELIVR_BASE}/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
  return `${JSDELIVR_BASE}/sprites/pokemon/${pokemonId}.png`;
}

/**
 * Convert GitHub raw URL to jsDelivr CDN URL
 * @param url - Original GitHub raw URL
 * @returns Converted jsDelivr URL or empty string
 */
export function convertGitHubUrlToJsDelivr(url: string): string {
  if (!url) return "";
  
  // Already using jsDelivr
  if (url.includes("cdn.jsdelivr.net")) return url;
  
  // Convert GitHub raw URLs to jsDelivr
  return url.replace(
    "https://raw.githubusercontent.com/PokeAPI/sprites/master",
    JSDELIVR_BASE
  );
}
