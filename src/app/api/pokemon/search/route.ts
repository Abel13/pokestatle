import { NextResponse } from "next/server";
import {
  getChallenge,
  getOrCreateTodayChallenge,
  getPokemonById,
  searchPokemon,
} from "@/lib/db/queries";
import { getChallengeDate } from "@/lib/game/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const date = searchParams.get("date");

  let generation: number | undefined;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    let challenge = await getChallenge(date);
    if (!challenge && date === getChallengeDate()) {
      challenge = await getOrCreateTodayChallenge(date);
    }
    if (challenge) {
      const target = await getPokemonById(challenge.pokemonId);
      generation = target?.generation;
    }
  }

  const results = await searchPokemon(q, 12, generation);
  return NextResponse.json(results);
}
