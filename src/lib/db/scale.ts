import { and, eq } from "drizzle-orm";
import {
  getPgDb,
  getSqliteDb,
  pgSchema,
  schema,
  usePostgres,
} from "@/lib/db";
import { pickScalePairs } from "@/lib/game/scale-daily";
import { scoreScaleGuess } from "@/lib/game/scale-score";
import {
  SCALE_ROUNDS,
  type ScaleChallengePublic,
  type ScaleGameState,
  type ScaleGameStatus,
  type ScalePair,
  type ScaleRoundPublic,
  type ScaleRoundResult,
} from "@/lib/game/scale-types";
import {
  challengeIdFromDate,
  getChallengeDate,
} from "@/lib/game/daily";
import { getPokemonById, getSecretSalt, listPoolPokemon } from "@/lib/db/queries";
import { resolveSpriteUrl } from "@/lib/pokemon/sprite-url";
import { ensureProfile } from "@/lib/db/games";

function parsePairs(value: unknown): ScalePair[] {
  if (Array.isArray(value)) return value as ScalePair[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ScalePair[];
    } catch {
      return [];
    }
  }
  return [];
}

function parseRounds(value: unknown): ScaleRoundResult[] {
  if (Array.isArray(value)) return value as ScaleRoundResult[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as ScaleRoundResult[];
    } catch {
      return [];
    }
  }
  return [];
}

export async function getScaleChallenge(date: string) {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select()
      .from(pgSchema.scaleChallenges)
      .where(eq(pgSchema.scaleChallenges.date, date))
      .limit(1);
    return rows[0] ?? null;
  }
  return (
    getSqliteDb()
      .select()
      .from(schema.scaleChallenges)
      .where(eq(schema.scaleChallenges.date, date))
      .get() ?? null
  );
}

export async function createScaleChallenge(date: string) {
  const pool = await listPoolPokemon();
  const pairs = pickScalePairs(
    pool.map((p) => ({ id: p.id, height: p.height })),
    date,
    getSecretSalt(),
  );
  const id = challengeIdFromDate(date);

  if (usePostgres()) {
    const db = getPgDb();
    await db
      .insert(pgSchema.scaleChallenges)
      .values({ id, date, pairsJson: pairs })
      .onConflictDoNothing();
    const created = await db
      .select()
      .from(pgSchema.scaleChallenges)
      .where(eq(pgSchema.scaleChallenges.date, date))
      .limit(1);
    if (!created[0]) throw new Error("Failed to materialize scale challenge.");
    return created[0];
  }

  const db = getSqliteDb();
  db.insert(schema.scaleChallenges)
    .values({ id, date, pairsJson: JSON.stringify(pairs) })
    .onConflictDoNothing()
    .run();
  const created = db
    .select()
    .from(schema.scaleChallenges)
    .where(eq(schema.scaleChallenges.date, date))
    .get();
  if (!created) throw new Error("Failed to materialize scale challenge.");
  return created;
}

export async function getOrCreateTodayScaleChallenge(
  date = getChallengeDate(),
) {
  const existing = await getScaleChallenge(date);
  if (existing) return existing;

  const today = getChallengeDate();
  if (date !== today) {
    throw new Error(
      `Scale challenge for ${date} does not exist. Historical challenges must be pre-created.`,
    );
  }
  return createScaleChallenge(date);
}

async function toPublicRound(
  pair: ScalePair,
  roundIndex: number,
  result?: ScaleRoundResult,
): Promise<ScaleRoundPublic> {
  const reference = await getPokemonById(pair.referenceId);
  const target = await getPokemonById(pair.targetId);
  if (!reference || !target) {
    throw new Error("Scale challenge Pokémon missing from catalog.");
  }

  const round: ScaleRoundPublic = {
    roundIndex,
    reference: {
      id: reference.id,
      name: reference.name,
      sprite: resolveSpriteUrl(reference.id, reference.sprite),
      heightDm: reference.height,
    },
    target: {
      id: target.id,
      name: target.name,
      sprite: resolveSpriteUrl(target.id, target.sprite),
    },
  };

  if (result) {
    round.targetHeightDm = result.realHeightDm;
    round.result = result;
  }

  return round;
}

export async function buildScaleChallengePublic(
  date: string,
  confirmedRounds: ScaleRoundResult[] = [],
): Promise<ScaleChallengePublic> {
  const challenge = await getOrCreateTodayScaleChallenge(date);
  const pairs = parsePairs(
    "pairsJson" in challenge
      ? (challenge as { pairsJson: unknown }).pairsJson
      : [],
  );
  const byIndex = new Map(confirmedRounds.map((r) => [r.roundIndex, r]));

  const rounds: ScaleRoundPublic[] = [];
  for (let i = 0; i < pairs.length; i++) {
    rounds.push(await toPublicRound(pairs[i]!, i, byIndex.get(i)));
  }

  return {
    challengeId: challenge.id,
    date,
    rounds,
  };
}

export async function getScaleGameProgress(
  userId: string,
  challengeId: number,
): Promise<ScaleGameState | null> {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select()
      .from(pgSchema.scaleGames)
      .where(
        and(
          eq(pgSchema.scaleGames.userId, userId),
          eq(pgSchema.scaleGames.challengeId, challengeId),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const challenge = await getPgDb()
      .select()
      .from(pgSchema.scaleChallenges)
      .where(eq(pgSchema.scaleChallenges.id, challengeId))
      .limit(1);
    return {
      challengeId,
      date: String(challenge[0]?.date ?? ""),
      rounds: parseRounds(row.roundsJson),
      totalScore: row.totalScore,
      status: row.status as ScaleGameStatus,
      completedAt: row.completedAt
        ? row.completedAt instanceof Date
          ? row.completedAt.toISOString()
          : String(row.completedAt)
        : undefined,
    };
  }

  const row = getSqliteDb()
    .select()
    .from(schema.scaleGames)
    .where(
      and(
        eq(schema.scaleGames.userId, userId),
        eq(schema.scaleGames.challengeId, challengeId),
      ),
    )
    .get();
  if (!row) return null;
  const challenge = getSqliteDb()
    .select()
    .from(schema.scaleChallenges)
    .where(eq(schema.scaleChallenges.id, challengeId))
    .get();
  return {
    challengeId,
    date: challenge?.date ?? "",
    rounds: parseRounds(row.roundsJson),
    totalScore: row.totalScore,
    status: row.status as ScaleGameStatus,
    completedAt: row.completedAt ?? undefined,
  };
}

export async function persistScaleRound(input: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  challengeId: number;
  date: string;
  rounds: ScaleRoundResult[];
  totalScore: number;
  status: ScaleGameStatus;
  completedAt?: string;
}) {
  await ensureProfile({
    userId: input.userId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
  });

  if (usePostgres()) {
    const db = getPgDb();
    const existing = await db
      .select()
      .from(pgSchema.scaleGames)
      .where(
        and(
          eq(pgSchema.scaleGames.userId, input.userId),
          eq(pgSchema.scaleGames.challengeId, input.challengeId),
        ),
      )
      .limit(1);
    const row = existing[0];
    const values = {
      status: input.status as "PLAYING" | "COMPLETE",
      roundsJson: input.rounds,
      totalScore: input.totalScore,
      completedAt: input.completedAt ? new Date(input.completedAt) : null,
    };
    if (row) {
      await db
        .update(pgSchema.scaleGames)
        .set(values)
        .where(eq(pgSchema.scaleGames.id, row.id));
    } else {
      await db.insert(pgSchema.scaleGames).values({
        userId: input.userId,
        challengeId: input.challengeId,
        ...values,
      });
    }
    return;
  }

  const db = getSqliteDb();
  const existing = db
    .select()
    .from(schema.scaleGames)
    .where(
      and(
        eq(schema.scaleGames.userId, input.userId),
        eq(schema.scaleGames.challengeId, input.challengeId),
      ),
    )
    .get();

  if (existing) {
    db.update(schema.scaleGames)
      .set({
        status: input.status,
        roundsJson: JSON.stringify(input.rounds),
        totalScore: input.totalScore,
        completedAt: input.completedAt ?? null,
      })
      .where(eq(schema.scaleGames.id, existing.id))
      .run();
  } else {
    db.insert(schema.scaleGames)
      .values({
        userId: input.userId,
        challengeId: input.challengeId,
        status: input.status,
        roundsJson: JSON.stringify(input.rounds),
        totalScore: input.totalScore,
        completedAt: input.completedAt ?? null,
      })
      .run();
  }
}

export class ScaleGuessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function processScaleGuess(input: {
  date: string;
  roundIndex: number;
  guessHeightDm: number;
  previousRounds?: ScaleRoundResult[];
}): Promise<{
  challengeId: number;
  date: string;
  round: ScaleRoundResult;
  rounds: ScaleRoundResult[];
  totalScore: number;
  status: ScaleGameStatus;
  completedAt?: string;
  publicChallenge: ScaleChallengePublic;
}> {
  if (
    !Number.isInteger(input.roundIndex) ||
    input.roundIndex < 0 ||
    input.roundIndex >= SCALE_ROUNDS
  ) {
    throw new ScaleGuessError("Invalid round index.", 400);
  }
  if (
    !Number.isFinite(input.guessHeightDm) ||
    input.guessHeightDm <= 0 ||
    input.guessHeightDm > 10_000
  ) {
    throw new ScaleGuessError("Invalid guess height.", 400);
  }

  const challenge = await getOrCreateTodayScaleChallenge(input.date);
  const pairs = parsePairs(
    (challenge as { pairsJson: unknown }).pairsJson,
  );
  const pair = pairs[input.roundIndex];
  if (!pair) throw new ScaleGuessError("Round not found.", 400);

  let priorRounds = input.previousRounds ?? [];
  let userId: string | null = null;
  let displayName = "Trainer";
  let avatarUrl: string | null = null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (user) {
      userId = user.id;
      displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Trainer";
      avatarUrl = user.user_metadata?.avatar_url ?? null;
      const progress = await getScaleGameProgress(user.id, challenge.id);
      if (progress) {
        if (progress.status === "COMPLETE") {
          throw new ScaleGuessError("Scale challenge already completed.", 400);
        }
        priorRounds = progress.rounds;
      }
    }
  } catch (err) {
    if (err instanceof ScaleGuessError) throw err;
  }

  if (priorRounds.some((r) => r.roundIndex === input.roundIndex)) {
    throw new ScaleGuessError("Round already confirmed.", 400);
  }
  if (priorRounds.length !== input.roundIndex) {
    throw new ScaleGuessError("Confirm rounds in order.", 400);
  }

  const target = await getPokemonById(pair.targetId);
  if (!target) throw new ScaleGuessError("Target Pokémon missing.", 500);

  const score = scoreScaleGuess(input.guessHeightDm, target.height);
  const round: ScaleRoundResult = {
    roundIndex: input.roundIndex,
    guessHeightDm: input.guessHeightDm,
    realHeightDm: target.height,
    score,
    confirmedAt: new Date().toISOString(),
  };
  const rounds = [...priorRounds, round];
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const status: ScaleGameStatus =
    rounds.length >= SCALE_ROUNDS ? "COMPLETE" : "PLAYING";
  const completedAt = status === "COMPLETE" ? round.confirmedAt : undefined;

  if (userId) {
    await persistScaleRound({
      userId,
      displayName,
      avatarUrl,
      challengeId: challenge.id,
      date: input.date,
      rounds,
      totalScore,
      status,
      completedAt,
    });
  }

  const publicChallenge = await buildScaleChallengePublic(input.date, rounds);

  return {
    challengeId: challenge.id,
    date: input.date,
    round,
    rounds,
    totalScore,
    status,
    completedAt,
    publicChallenge,
  };
}
