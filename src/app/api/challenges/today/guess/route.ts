import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateTodayChallenge,
  getPokemonById,
} from "@/lib/db/queries";
import { comparePokemon } from "@/lib/game/compare";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";
import { createClient } from "@/lib/supabase/server";
import { persistGuessForUser } from "@/lib/db/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  pokemonId: z.number().int().positive(),
  previousGuesses: z.array(z.number().int().positive()).max(MAX_GUESSES).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const date = getChallengeDate();
    const challenge = getOrCreateTodayChallenge(date);
    const previous = body.previousGuesses ?? [];

    if (previous.length >= MAX_GUESSES) {
      return NextResponse.json(
        { error: "No guesses remaining." },
        { status: 400 },
      );
    }

    if (previous.includes(body.pokemonId)) {
      return NextResponse.json(
        { error: "You already guessed that Pokémon." },
        { status: 400 },
      );
    }

    const guess = getPokemonById(body.pokemonId);
    if (!guess) {
      return NextResponse.json(
        { error: "Pokémon not found in the eligible pool." },
        { status: 400 },
      );
    }

    const target = getPokemonById(challenge.pokemonId);
    if (!target) {
      return NextResponse.json(
        { error: "Challenge target missing." },
        { status: 500 },
      );
    }

    const result = comparePokemon(guess, target);
    const guessNumber = previous.length + 1;
    const remainingGuesses = MAX_GUESSES - guessNumber;
    const guesses = [...previous, body.pokemonId];
    const won = result.isCorrect;
    const lost = !won && remainingGuesses === 0;

    let revealedPokemon:
      | { id: number; name: string; sprite: string }
      | undefined;
    if (won || lost) {
      revealedPokemon = {
        id: target.id,
        name: target.name,
        sprite: target.sprite,
      };
    }

    // Persist for authenticated users when available
    try {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await persistGuessForUser({
            userId: user.id,
            challengeId: challenge.id,
            guessId: body.pokemonId,
            result,
            won,
            lost,
            displayName:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email ||
              "Trainer",
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          });
        }
      }
    } catch {
      // Auth optional in local/dev without Supabase credentials
    }

    return NextResponse.json({
      guessNumber,
      isCorrect: won,
      remainingGuesses,
      status: won ? "WON" : lost ? "LOST" : "PLAYING",
      revealedPokemon,
      result: {
        pokemon: {
          id: guess.id,
          name: guess.name,
          sprite: guess.sprite,
        },
        ...result.attributes,
        isCorrect: result.isCorrect,
        pokemonId: result.pokemonId,
        name: result.name,
        sprite: result.sprite,
        attributes: result.attributes,
      },
      challengeId: challenge.id,
      date,
      guesses,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to submit guess";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
