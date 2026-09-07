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

function dirEmoji(direction: AttributeResult["direction"]): string {
  if (direction === "UP") return "⬆️";
  if (direction === "DOWN") return "⬇️";
  return "";
}

function attributeEmoji(result: AttributeResult): string {
  const base = statusEmoji(result.status);
  if (result.status === "EXACT") return base;
  return `${base}${dirEmoji(result.direction)}`;
}

function typesEmoji(types: GuessResult["attributes"]["types"]): string {
  if (types.length === 0) return "⬛";
  if (types.every((t) => t.match)) return "🟩";
  if (types.some((t) => t.match)) return "🟨";
  return "⬛";
}

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
