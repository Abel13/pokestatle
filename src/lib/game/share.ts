import { calculateResultScore, formatScoreLine } from "./score";
import type { AttributeResult, GuessResult, MatchStatus } from "./types";

/**
 * Unified feedback glyph:
 * - Far → direction only (⬆️ / ⬇️)
 * - Close / exact → color only (🟧 / 🟨 / 🟩)
 */
function slotEmoji(
  status: MatchStatus,
  direction: AttributeResult["direction"],
): string {
  if (status === "FAR") {
    if (direction === "UP") return "⬆️";
    if (direction === "DOWN") return "⬇️";
    return "⬛";
  }
  if (status === "EXACT") return "🟩";
  if (status === "VERY_CLOSE") return "🟨";
  return "🟧";
}

function typesSlot(types: GuessResult["attributes"]["types"]): string {
  if (types.length > 0 && types.every((t) => t.match)) return "🟩";
  if (types.some((t) => t.match)) return "🟨";
  return "⬛";
}

/**
 * One emoji per attribute (Gen · Types · Ht · Wt · HP · Atk · Def · SpA · SpD · Spe).
 * Far = direction; close/exact = color.
 */
export function formatShareText(
  challengeId: number,
  results: GuessResult[],
  won: boolean,
  maxGuesses: number,
): string {
  const attempts = won ? `${results.length}/${maxGuesses}` : `X/${maxGuesses}`;
  const grade = formatScoreLine(calculateResultScore(results, won, maxGuesses));
  const lines = results.map((r) => {
    const a = r.attributes;
    return [
      slotEmoji(a.generation.status, a.generation.direction),
      typesSlot(a.types),
      slotEmoji(a.height.status, a.height.direction),
      slotEmoji(a.weight.status, a.weight.direction),
      slotEmoji(a.hp.status, a.hp.direction),
      slotEmoji(a.attack.status, a.attack.direction),
      slotEmoji(a.defense.status, a.defense.direction),
      slotEmoji(a.specialAttack.status, a.specialAttack.direction),
      slotEmoji(a.specialDefense.status, a.specialDefense.direction),
      slotEmoji(a.speed.status, a.speed.direction),
    ].join("");
  });

  return [`PokéStatle #${challengeId}`, ...lines, attempts, grade].join("\n");
}
