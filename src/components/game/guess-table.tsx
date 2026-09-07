"use client";

import Image from "next/image";
import type { GuessResult } from "@/lib/game/types";
import {
  AttributeCell,
  GenerationCell,
  TypesCell,
} from "@/components/game/attribute-cell";

const headers = [
  "Pokémon",
  "Gen",
  "Types",
  "Ht",
  "Wt",
  "HP",
  "Atk",
  "Def",
  "SpA",
  "SpD",
  "Spe",
] as const;

function formatHeight(dm: number) {
  return `${(dm / 10).toFixed(1)}m`;
}
function formatWeight(hg: number) {
  return `${(hg / 10).toFixed(1)}kg`;
}

export function GuessTable({ results }: { results: GuessResult[] }) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
        Make a guess to start revealing clues.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background/70 shadow-sm backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {headers.map((h) => (
                <th
                  key={h}
                  className={
                    h === "Pokémon"
                      ? "sticky left-0 z-10 bg-muted/90 px-3 py-2 backdrop-blur"
                      : "px-2 py-2 font-medium"
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...results].reverse().map((result, rowIndex) => {
              const a = result.attributes;
              const baseDelay = 0.04;
              return (
                <tr
                  key={`${result.pokemonId}-${rowIndex}`}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="sticky left-0 z-10 bg-background/95 px-3 py-2 backdrop-blur">
                    <div className="flex items-center gap-2">
                      {result.sprite ? (
                        <Image
                          src={result.sprite}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 object-contain"
                          unoptimized
                        />
                      ) : null}
                      <span className="font-medium">{result.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <GenerationCell result={a.generation} delay={baseDelay} />
                  </td>
                  <td className="px-2 py-2">
                    <TypesCell types={a.types} delay={baseDelay * 2} />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell
                      result={{
                        ...a.height,
                        guessValue: Number((a.height.guessValue / 10).toFixed(1)),
                      }}
                      delay={baseDelay * 3}
                      label={formatHeight(a.height.guessValue)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell
                      result={{
                        ...a.weight,
                        guessValue: Number((a.weight.guessValue / 10).toFixed(1)),
                      }}
                      delay={baseDelay * 4}
                      label={formatWeight(a.weight.guessValue)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell result={a.hp} delay={baseDelay * 5} />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell result={a.attack} delay={baseDelay * 6} />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell result={a.defense} delay={baseDelay * 7} />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell
                      result={a.specialAttack}
                      delay={baseDelay * 8}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell
                      result={a.specialDefense}
                      delay={baseDelay * 9}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <AttributeCell result={a.speed} delay={baseDelay * 10} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
