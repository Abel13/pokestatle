import { NextResponse } from "next/server";
import { z } from "zod";
import { getChallengeDate } from "@/lib/game/daily";
import { processScaleGuess, ScaleGuessError } from "@/lib/db/scale";
import { SCALE_ROUNDS } from "@/lib/game/scale-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  roundIndex: z.number().int().min(0).max(SCALE_ROUNDS - 1),
  guessHeightDm: z.number().positive().max(10_000),
  previousRounds: z
    .array(
      z.object({
        roundIndex: z.number().int(),
        guessHeightDm: z.number(),
        realHeightDm: z.number(),
        score: z.number(),
        confirmedAt: z.string(),
      }),
    )
    .max(SCALE_ROUNDS)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);
    const payload = await processScaleGuess({
      date: body.date ?? getChallengeDate(),
      roundIndex: body.roundIndex,
      guessHeightDm: body.guessHeightDm,
      previousRounds: body.previousRounds,
    });
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    if (error instanceof ScaleGuessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to submit scale guess";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
