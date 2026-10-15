"use client";

import Image from "next/image";
import { MatchMark } from "@/components/game/match-mark";
import { cn } from "@/lib/utils";

const TYPE_ASSETS = {
  normal: { label: "Normal", color: "#A8A77A", src: "/types/normal.png" },
  fire: { label: "Fire", color: "#EE8130", src: "/types/fire.png" },
  water: { label: "Water", color: "#6390F0", src: "/types/water.png" },
  electric: { label: "Electric", color: "#F7D02C", src: "/types/electric.png" },
  grass: { label: "Grass", color: "#7AC74C", src: "/types/grass.png" },
  ice: { label: "Ice", color: "#96D9D6", src: "/types/ice.png" },
  fighting: { label: "Fighting", color: "#C22E28", src: "/types/fighting.png" },
  poison: { label: "Poison", color: "#A33EA1", src: "/types/poison.png" },
  ground: { label: "Ground", color: "#E2BF65", src: "/types/ground.png" },
  flying: { label: "Flying", color: "#A98FF3", src: "/types/flying.png" },
  psychic: { label: "Psychic", color: "#F95587", src: "/types/psychic.png" },
  bug: { label: "Bug", color: "#A6B91A", src: "/types/bug.png" },
  rock: { label: "Rock", color: "#B6A136", src: "/types/rock.png" },
  ghost: { label: "Ghost", color: "#735797", src: "/types/ghost.png" },
  dragon: { label: "Dragon", color: "#6F35FC", src: "/types/dragon.png" },
  dark: { label: "Dark", color: "#705746", src: "/types/dark.png" },
  steel: { label: "Steel", color: "#B7B7CE", src: "/types/steel.png" },
  fairy: { label: "Fairy", color: "#D685AD", src: "/types/fairy.png" },
} as const;

type PokemonType = keyof typeof TYPE_ASSETS;

export const TYPE_COLORS: Record<PokemonType, string> = Object.fromEntries(
  Object.entries(TYPE_ASSETS).map(([type, asset]) => [type, asset.color]),
) as Record<PokemonType, string>;

function isPokemonType(type: string): type is PokemonType {
  return type in TYPE_ASSETS;
}

export function TypeIcon({
  type,
  className,
  matched,
}: {
  type: string;
  className?: string;
  matched?: boolean;
}) {
  const normalizedType = type.toLowerCase();
  const asset =
    TYPE_ASSETS[isPokemonType(normalizedType) ? normalizedType : "normal"];
  const mark = (
    <Image
      src={asset.src}
      alt={asset.label}
      width={32}
      height={32}
      className={cn("size-6 shrink-0 object-contain", className)}
    />
  );

  if (matched === undefined) {
    return (
      <span className={cn("relative inline-flex", className)} title={type}>
        {mark}
      </span>
    );
  }

  return (
    <MatchMark matched={matched} label={type} className={className}>
      {mark}
    </MatchMark>
  );
}
