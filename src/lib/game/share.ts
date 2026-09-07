import type { AttributeResult, GuessResult, MatchStatus } from "./types";

function statusEmoji(status: MatchStatus): string {
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

/** Always one glyph so every attribute slot is the same width. */
function dirEmoji(direction: AttributeResult["direction"]): string {
  if (direction === "UP") return "⬆️";
  if (direction === "DOWN") return "⬇️";
  return "➖";
}

function attributeEmoji(result: AttributeResult): string {
  return `${statusEmoji(result.status)}${dirEmoji(result.direction)}`;
}

function typesEmoji(types: GuessResult["attributes"]["types"]): string {
  let status: MatchStatus = "FAR";
  if (types.length > 0 && types.every((t) => t.match)) status = "EXACT";
  else if (types.some((t) => t.match)) status = "VERY_CLOSE";
  // Types have no direction — keep a spacer so the line length stays fixed.
  return `${statusEmoji(status)}➖`;
}

/**
 * Fixed layout per guess (10 slots × 2 emojis):
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
      attributeEmoji(a.generation),
      typesEmoji(a.types),
      attributeEmoji(a.height),
      attributeEmoji(a.weight),
      attributeEmoji(a.hp),
      attributeEmoji(a.attack),
      attributeEmoji(a.defense),
      attributeEmoji(a.specialAttack),
      attributeEmoji(a.specialDefense),
      attributeEmoji(a.speed),
    ].join("");
  });

  return [`PokéStatle #${challengeId}`, ...lines, score].join("\n");
}
