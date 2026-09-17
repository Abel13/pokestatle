import { getOrCreateTodayChallenge, getPokemonById } from "@/lib/db/queries";
import { persistGuessForUser, getUserGameProgress } from "@/lib/db/games";
import { comparePokemon } from "@/lib/game/compare";
import {
  buildChallengeHints,
  hintUnlockCount,
  type ChallengeHints,
} from "@/lib/game/hints";
import { MAX_GUESSES, type GameStatus } from "@/lib/game/types";
import { createClient } from "@/lib/supabase/server";

export class GuessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type ProcessGuessResult = {
  guessNumber: number;
  isCorrect: boolean;
  remainingGuesses: number;
  status: GameStatus;
  revealedPokemon?: { id: number; name: string; sprite: string };
  result: {
    pokemon: { id: number; name: string; sprite: string };
    isCorrect: boolean;
    pokemonId: number;
    name: string;
    sprite: string;
    attributes: ReturnType<typeof comparePokemon>["attributes"];
    generation: ReturnType<typeof comparePokemon>["attributes"]["generation"];
    types: ReturnType<typeof comparePokemon>["attributes"]["types"];
    evolution: ReturnType<typeof comparePokemon>["attributes"]["evolution"];
    colors: ReturnType<typeof comparePokemon>["attributes"]["colors"];
    height: ReturnType<typeof comparePokemon>["attributes"]["height"];
    weight: ReturnType<typeof comparePokemon>["attributes"]["weight"];
    hp: ReturnType<typeof comparePokemon>["attributes"]["hp"];
    attack: ReturnType<typeof comparePokemon>["attributes"]["attack"];
    defense: ReturnType<typeof comparePokemon>["attributes"]["defense"];
    specialAttack: ReturnType<typeof comparePokemon>["attributes"]["specialAttack"];
    specialDefense: ReturnType<typeof comparePokemon>["attributes"]["specialDefense"];
    speed: ReturnType<typeof comparePokemon>["attributes"]["speed"];
  };
  challengeId: number;
  date: string;
  guesses: number[];
  hints: ChallengeHints;
};

export async function processGuess(input: {
  date: string;
  pokemonId: number;
  previousGuesses: number[];
}): Promise<ProcessGuessResult> {
  const challenge = await getOrCreateTodayChallenge(input.date);
  const previous = input.previousGuesses;

  let serverGuessCount = 0;
  let serverStatus: GameStatus = "PLAYING";
  try {
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      const progress = await getUserGameProgress(user.id, challenge.id);
      if (progress) {
        serverGuessCount = progress.guessCount;
        serverStatus = progress.status;
      }
    }
  } catch {
    // Auth optional in local/dev without Supabase credentials
  }

  const actualGuessCount = Math.max(serverGuessCount, previous.length);

  if (actualGuessCount >= MAX_GUESSES) {
    throw new GuessError("No guesses remaining.", 400);
  }

  if (serverStatus !== "PLAYING") {
    throw new GuessError("Game already completed.", 400);
  }

  if (previous.includes(input.pokemonId)) {
    throw new GuessError("You already guessed that Pokémon.", 400);
  }

  const guess = await getPokemonById(input.pokemonId);
  if (!guess) {
    throw new GuessError("Pokémon not found in the eligible pool.", 400);
  }

  const target = await getPokemonById(challenge.pokemonId);
  if (!target) {
    throw new GuessError("Challenge target missing.", 500);
  }

  if (guess.generation !== target.generation) {
    throw new GuessError(
      "Search is limited to today's generation. Pick a Pokémon from that generation.",
      400,
    );
  }

  const comparison = comparePokemon(guess, target);
  const guessNumber = previous.length + 1;
  const remainingGuesses = MAX_GUESSES - guessNumber;
  const guesses = [...previous, input.pokemonId];
  const won = comparison.isCorrect;
  const lost = !won && remainingGuesses === 0;
  const status: GameStatus = won ? "WON" : lost ? "LOST" : "PLAYING";

  let revealedPokemon: ProcessGuessResult["revealedPokemon"];
  if (won || lost) {
    revealedPokemon = {
      id: target.id,
      name: target.name,
      sprite: target.sprite,
    };
  }

  try {
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      await persistGuessForUser({
        userId: user.id,
        challengeId: challenge.id,
        guessId: input.pokemonId,
        result: comparison,
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
  } catch {
    // Auth optional in local/dev without Supabase credentials
  }

  const hints = buildChallengeHints(
    target,
    hintUnlockCount(guesses.length, status),
  );

  return {
    guessNumber,
    isCorrect: won,
    remainingGuesses,
    status,
    revealedPokemon,
    result: {
      pokemon: {
        id: guess.id,
        name: guess.name,
        sprite: guess.sprite,
      },
      ...comparison.attributes,
      isCorrect: comparison.isCorrect,
      pokemonId: comparison.pokemonId,
      name: comparison.name,
      sprite: comparison.sprite,
      attributes: comparison.attributes,
    },
    challengeId: challenge.id,
    date: input.date,
    guesses,
    hints,
  };
}
