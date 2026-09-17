import { NextResponse } from "next/server";
import { z } from "zod";
import { getChallengeDate } from "@/lib/game/daily";
import { MAX_GUESSES } from "@/lib/game/types";
import { GuessError, processGuess } from "@/lib/game/process-guess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  pokemonId: z.number().int().positive(),
  previousGuesses: z
    .array(z.number().int().positive())
    .max(MAX_GUESSES)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const payload = await processGuess({
      date: getChallengeDate(),
      pokemonId: body.pokemonId,
      previousGuesses: body.previousGuesses ?? [],
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    if (error instanceof GuessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to submit guess";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
