import type { GuessResult, MatchStatus } from "./types";

function statusChar(status: MatchStatus): string {
  switch (status) {
    case "EXACT":
      return "E";
    case "VERY_CLOSE":
      return "~";
    case "CLOSE":
      return ".";
    default:
      return "-";
  }
}

function dirChar(direction: "UP" | "DOWN" | null): string {
  if (direction === "UP") return "^";
  if (direction === "DOWN") return "v";
  return "=";
}

function typeChars(types: GuessResult["attributes"]["types"]): string {
  if (types.every((t) => t.match)) return "T";
  if (types.some((t) => t.match)) return "t";
  return "x";
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
      statusChar(a.generation.status) + dirChar(a.generation.direction),
      typeChars(a.types),
      statusChar(a.height.status) + dirChar(a.height.direction),
      statusChar(a.weight.status) + dirChar(a.weight.direction),
      statusChar(a.hp.status) + dirChar(a.hp.direction),
      statusChar(a.attack.status) + dirChar(a.attack.direction),
      statusChar(a.defense.status) + dirChar(a.defense.direction),
      statusChar(a.specialAttack.status) + dirChar(a.specialAttack.direction),
      statusChar(a.specialDefense.status) + dirChar(a.specialDefense.direction),
      statusChar(a.speed.status) + dirChar(a.speed.direction),
    ].join(" ");
  });

  return [`PokéStatle #${challengeId}`, ...lines, score].join("\n");
}
