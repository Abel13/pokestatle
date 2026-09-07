import type { AttributeResult, GuessResult, MatchStatus } from "./types";

/** First emoji in every slot: proximity. */
function proximityEmoji(status: MatchStatus): string {
  switch (status) {
    case "EXACT":
      return "🟩";
    case "VERY_CLOSE":
      return "🟨";
    case "CLOSE":
      return "🟧";
    default:
      return "⬛";
  }
}

/** Second emoji in every slot: direction (➖ when exact / N/A). */
function directionEmoji(direction: AttributeResult["direction"]): string {
  if (direction === "UP") return "⬆️";
  if (direction === "DOWN") return "⬇️";
  return "➖";
}

/** Always: [proximity][direction] */
function slotEmoji(
  proximity: MatchStatus,
  direction: AttributeResult["direction"],
): string {
  return `${proximityEmoji(proximity)}${directionEmoji(direction)}`;
}

function typesSlot(types: GuessResult["attributes"]["types"]): string {
  let proximity: MatchStatus = "FAR";
  if (types.length > 0 && types.every((t) => t.match)) proximity = "EXACT";
  else if (types.some((t) => t.match)) proximity = "VERY_CLOSE";
  return slotEmoji(proximity, null);
}

/**
 * Fixed layout per guess — each attribute is always two emojis:
 * 1) proximity  2) direction
 * Gen · Types · Ht · Wt · HP · Atk · Def · SpA · SpD · Spe
 */
export function formatShareText(
  challengeId: number,
  results: GuessResult[],
  won: boolean,
  maxGuesses: number,
): string {
  const score = won ? `${results.length}/${maxGuesses}` : `X/${maxGuesses}`;
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

  return [`PokéStatle #${challengeId}`, ...lines, score].join("\n");
}
