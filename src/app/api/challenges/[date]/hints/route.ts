import { NextResponse } from "next/server";
import {
  getChallenge,
  getOrCreateTodayChallenge,
  getPokemonById,
} from "@/lib/db/queries";
import { getUserGameProgress } from "@/lib/db/games";
import { assertNotFuture, getChallengeDate } from "@/lib/game/daily";
import {
  buildChallengeHints,
  hintUnlockCount,
  type ChallengeHints,
} from "@/lib/game/hints";
import type { GameStatus } from "@/lib/game/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function parseStatus(value: string | null): GameStatus | undefined {
  if (value === "PLAYING" || value === "WON" || value === "LOST") return value;
  return undefined;
}

async function loadHints(
  date: string,
  clientGuessCount: number,
  clientStatus: GameStatus,
): Promise<ChallengeHints> {
  let challenge = await getChallenge(date);
  if (!challenge && date === getChallengeDate()) {
    challenge = await getOrCreateTodayChallenge(date);
  }
  if (!challenge) {
    throw Object.assign(new Error("Challenge for this date doesn't exist."), {
      status: 404,
    });
  }

  const target = await getPokemonById(challenge.pokemonId);
  if (!target) {
    throw Object.assign(new Error("Challenge target missing."), { status: 500 });
  }

  let guessesMade = clientGuessCount;
  let status = clientStatus;

  try {
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      const progress = await getUserGameProgress(user.id, challenge.id);
      if (progress) {
        guessesMade = Math.max(progress.guessCount, clientGuessCount);
        status = progress.status;
      }
    }
  } catch {
    // Guests trust the query string, matching previousGuesses on guess POST.
  }

  return buildChallengeHints(target, hintUnlockCount(guessesMade, status));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400, headers: NO_STORE },
      );
    }

    assertNotFuture(date);

    const url = new URL(request.url);
    const guessCount = Number(url.searchParams.get("guessCount") ?? "0");
    const status = parseStatus(url.searchParams.get("status")) ?? "PLAYING";
    const hints = await loadHints(
      date,
      Number.isFinite(guessCount) ? Math.max(0, Math.floor(guessCount)) : 0,
      status,
    );
    return NextResponse.json(hints, { headers: NO_STORE });
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number(error.status)
        : 500;
    const message =
      error instanceof Error ? error.message : "Failed to load hints";
    return NextResponse.json(
      { error: message },
      { status: Number.isFinite(status) ? status : 500, headers: NO_STORE },
    );
  }
}
