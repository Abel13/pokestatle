import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureProfile,
  persistGuessForUser,
} from "@/lib/db/games";
import { getOrCreateTodayChallenge, getPokemonById } from "@/lib/db/queries";
import { comparePokemon } from "@/lib/game/compare";
import { getChallengeDate } from "@/lib/game/daily";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  challengeId: z.number().int().positive(),
  date: z.string(),
  guesses: z.array(z.number().int().positive()).max(6),
  status: z.enum(["PLAYING", "WON", "LOST"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 401 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const today = getChallengeDate();
  if (body.date !== today) {
    return NextResponse.json(
      { error: "Only today's guest game can be synced." },
      { status: 400 },
    );
  }

  const challenge = getOrCreateTodayChallenge(today);
  if (challenge.id !== body.challengeId) {
    return NextResponse.json({ error: "Challenge mismatch" }, { status: 400 });
  }

  await ensureProfile({
    userId: user.id,
    displayName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Trainer",
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  });

  const target = getPokemonById(challenge.pokemonId);
  if (!target) {
    return NextResponse.json({ error: "Target missing" }, { status: 500 });
  }

  for (let i = 0; i < body.guesses.length; i++) {
    const id = body.guesses[i]!;
    const guess = getPokemonById(id);
    if (!guess) continue;
    const result = comparePokemon(guess, target);
    const won = result.isCorrect;
    const lost = !won && i === body.guesses.length - 1 && body.status === "LOST";
    await persistGuessForUser({
      userId: user.id,
      challengeId: challenge.id,
      guessId: id,
      result,
      won,
      lost: lost || (!won && i === 5),
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Trainer",
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
