import type { Difficulty } from "@/lib/game/types";

export function classifyDifficulty(input: {
  generation: number;
  isLegendary: boolean;
  isMythical: boolean;
  baseStatTotal: number;
  evolutionStage: number;
}): Difficulty {
  if (input.isMythical) return "EXPERT";
  if (input.isLegendary) return "HARD";
  if (input.baseStatTotal >= 600) return "HARD";
  if (
    input.generation <= 3 &&
    input.evolutionStage <= 2 &&
    input.baseStatTotal <= 450
  ) {
    return "EASY";
  }
  return "NORMAL";
}

const FORM_BLOCKLIST = [
  "-mega",
  "-gmax",
  "-gigantamax",
  "-alola",
  "-galar",
  "-hisui",
  "-paldea",
  "-cosplay",
  "-rock-star",
  "-belle",
  "-pop-star",
  "-phd",
  "-libre",
  "-cap",
  "-totem",
  "-battle-bond",
  "-ash",
  "-primal",
  "-origin",
  "-therian",
  "-black",
  "-white",
  "-resolute",
  "-pirouette",
  "-blade",
  "-school",
  "-busted",
  "-dawn",
  "-ultra",
  "-dusk",
  "-midnight",
  "-low-key",
  "-noice",
  "-hangry",
  "-crowned",
  "-eternamax",
  "-ice",
  "-shadow",
  "-hero",
  "-drop-down",
  "-family-of-three",
  "-family-of-four",
  "-bloodmoon",
  "-wellspring",
  "-hearthflame",
  "-cornerstone",
  "-teal",
  "-stellar",
];

/** Keep default forms / base species names only. */
export function isEligibleSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  if (FORM_BLOCKLIST.some((part) => s.includes(part))) return false;
  // Regional / alternate form patterns with hyphen and region-like tokens already covered.
  // Allow gendered Nidoran etc. without alternate cosmetics.
  if (s.includes("-mega-")) return false;
  return true;
}

export function titleCaseName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
