import { and, eq } from "drizzle-orm";
import {
  getPgDb,
  getSqliteDb,
  pgSchema,
  schema,
  usePostgres,
} from "@/lib/db";
import type { GuessResult } from "@/lib/game/types";
import { MAX_GUESSES } from "@/lib/game/types";
import { calculateResultScore } from "@/lib/game/score";

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }
  return [];
}

function asIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function ensureProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  if (usePostgres()) {
    const db = getPgDb();
    const existing = await db
      .select()
      .from(pgSchema.profiles)
      .where(eq(pgSchema.profiles.id, input.userId))
      .limit(1);
    if (existing[0]) return;

    await db.insert(pgSchema.profiles).values({
      id: input.userId,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    });
    await db
      .insert(pgSchema.userStats)
      .values({ userId: input.userId })
      .onConflictDoNothing();
    return;
  }

  const db = getSqliteDb();
  const existing = db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, input.userId))
    .get();
  if (!existing) {
    db.insert(schema.profiles)
      .values({
        id: input.userId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      })
      .run();
    db.insert(schema.userStats)
      .values({ userId: input.userId })
      .onConflictDoNothing()
      .run();
  }
}

export async function persistGuessForUser(input: {
  userId: string;
  challengeId: number;
  guessId: number;
  result: GuessResult;
  won: boolean;
  lost: boolean;
  displayName: string;
  avatarUrl: string | null;
}) {
  await ensureProfile(input);

  if (usePostgres()) {
    const db = getPgDb();
    const existingRows = await db
      .select()
      .from(pgSchema.games)
      .where(
        and(
          eq(pgSchema.games.userId, input.userId),
          eq(pgSchema.games.challengeId, input.challengeId),
        ),
      )
      .limit(1);
    const existing = existingRows[0];

    const guesses = existing
      ? parseJsonArray<number>(existing.guessesJson)
      : [];
    const results = existing
      ? parseJsonArray<GuessResult>(existing.resultsJson)
      : [];

    if (guesses.includes(input.guessId)) return;

    guesses.push(input.guessId);
    results.push(input.result);

    const status = input.won ? "WON" : input.lost ? "LOST" : "PLAYING";
    const completedAt =
      status === "PLAYING" ? null : new Date();

    let scoreData: {
      score: number | null;
      grade: string | null;
      efficiency: number | null;
      accuracy: number | null;
    } = { score: null, grade: null, efficiency: null, accuracy: null };

    if (status !== "PLAYING") {
      const resultScore = calculateResultScore(results, input.won, MAX_GUESSES);
      scoreData = {
        score: resultScore.score,
        grade: resultScore.grade,
        efficiency: resultScore.efficiency,
        accuracy: resultScore.accuracy,
      };
    }

    if (existing) {
      await db
        .update(pgSchema.games)
        .set({
          status,
          guessesJson: guesses,
          resultsJson: results,
          completedAt,
          score: scoreData.score,
          grade: scoreData.grade,
          efficiency: scoreData.efficiency,
          accuracy: scoreData.accuracy,
        })
        .where(eq(pgSchema.games.id, existing.id));
    } else {
      await db.insert(pgSchema.games).values({
        userId: input.userId,
        challengeId: input.challengeId,
        status,
        guessesJson: guesses,
        resultsJson: results,
        completedAt,
        score: scoreData.score,
        grade: scoreData.grade,
        efficiency: scoreData.efficiency,
        accuracy: scoreData.accuracy,
      });
    }

    if (status === "WON" || status === "LOST") {
      await updateStatsOnComplete({
        userId: input.userId,
        challengeId: input.challengeId,
        won: input.won,
        guessCount: guesses.length,
      });
    }
    return;
  }

  const db = getSqliteDb();
  const existing = db
    .select()
    .from(schema.games)
    .where(
      and(
        eq(schema.games.userId, input.userId),
        eq(schema.games.challengeId, input.challengeId),
      ),
    )
    .get();

  const guesses: number[] = existing
    ? (JSON.parse(existing.guessesJson) as number[])
    : [];
  const results: GuessResult[] = existing
    ? (JSON.parse(existing.resultsJson) as GuessResult[])
    : [];

  if (guesses.includes(input.guessId)) return;

  guesses.push(input.guessId);
  results.push(input.result);

  const status = input.won ? "WON" : input.lost ? "LOST" : "PLAYING";
  const completedAt =
    status === "PLAYING" ? null : new Date().toISOString();

  let scoreData: {
    score: number | null;
    grade: string | null;
    efficiency: number | null;
    accuracy: number | null;
  } = { score: null, grade: null, efficiency: null, accuracy: null };

  if (status !== "PLAYING") {
    const resultScore = calculateResultScore(results, input.won, MAX_GUESSES);
    scoreData = {
      score: resultScore.score,
      grade: resultScore.grade,
      efficiency: resultScore.efficiency,
      accuracy: resultScore.accuracy,
    };
  }

  if (existing) {
    db.update(schema.games)
      .set({
        status,
        guessesJson: JSON.stringify(guesses),
        resultsJson: JSON.stringify(results),
        completedAt,
        score: scoreData.score,
        grade: scoreData.grade,
        efficiency: scoreData.efficiency,
        accuracy: scoreData.accuracy,
      })
      .where(eq(schema.games.id, existing.id))
      .run();
  } else {
    db.insert(schema.games)
      .values({
        userId: input.userId,
        challengeId: input.challengeId,
        status,
        guessesJson: JSON.stringify(guesses),
        resultsJson: JSON.stringify(results),
        completedAt,
        score: scoreData.score,
        grade: scoreData.grade,
        efficiency: scoreData.efficiency,
        accuracy: scoreData.accuracy,
      })
      .run();
  }

  if (status === "WON" || status === "LOST") {
    await updateStatsOnComplete({
      userId: input.userId,
      challengeId: input.challengeId,
      won: input.won,
      guessCount: guesses.length,
    });
  }
}

async function updateStatsOnComplete(input: {
  userId: string;
  challengeId: number;
  won: boolean;
  guessCount: number;
}) {
  if (usePostgres()) {
    const db = getPgDb();
    const statsRows = await db
      .select()
      .from(pgSchema.userStats)
      .where(eq(pgSchema.userStats.userId, input.userId))
      .limit(1);
    const stats = statsRows[0];

    const distribution = stats
      ? parseJsonArray<number>(stats.distributionJson)
      : [0, 0, 0, 0, 0, 0];
    while (distribution.length < 6) distribution.push(0);

    let currentStreak = stats?.currentStreak ?? 0;
    let maxStreak = stats?.maxStreak ?? 0;
    const last = stats?.lastChallengeId ?? null;

    if (input.won) {
      if (last && input.challengeId === last + 1) currentStreak += 1;
      else if (last !== input.challengeId) currentStreak = 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      if (input.guessCount >= 1 && input.guessCount <= 6) {
        distribution[input.guessCount - 1] =
          (distribution[input.guessCount - 1] ?? 0) + 1;
      }
    } else {
      currentStreak = 0;
    }

    const played = (stats?.played ?? 0) + (last === input.challengeId ? 0 : 1);
    const wins =
      (stats?.wins ?? 0) + (input.won && last !== input.challengeId ? 1 : 0);

    await db
      .insert(pgSchema.userStats)
      .values({
        userId: input.userId,
        played,
        wins,
        currentStreak,
        maxStreak,
        distributionJson: distribution,
        lastChallengeId: input.challengeId,
      })
      .onConflictDoUpdate({
        target: pgSchema.userStats.userId,
        set: {
          played,
          wins,
          currentStreak,
          maxStreak,
          distributionJson: distribution,
          lastChallengeId: input.challengeId,
        },
      });
    return;
  }

  const db = getSqliteDb();
  const stats = db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, input.userId))
    .get();

  const distribution = stats
    ? (JSON.parse(stats.distributionJson) as number[])
    : [0, 0, 0, 0, 0, 0];

  let currentStreak = stats?.currentStreak ?? 0;
  let maxStreak = stats?.maxStreak ?? 0;
  const last = stats?.lastChallengeId ?? null;

  if (input.won) {
    if (last && input.challengeId === last + 1) {
      currentStreak += 1;
    } else if (last === input.challengeId) {
      // already counted
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    if (input.guessCount >= 1 && input.guessCount <= 6) {
      distribution[input.guessCount - 1] =
        (distribution[input.guessCount - 1] ?? 0) + 1;
    }
  } else {
    currentStreak = 0;
  }

  db.insert(schema.userStats)
    .values({
      userId: input.userId,
      played: (stats?.played ?? 0) + (last === input.challengeId ? 0 : 1),
      wins: (stats?.wins ?? 0) + (input.won && last !== input.challengeId ? 1 : 0),
      currentStreak,
      maxStreak,
      distributionJson: JSON.stringify(distribution),
      lastChallengeId: input.challengeId,
    })
    .onConflictDoUpdate({
      target: schema.userStats.userId,
      set: {
        played: (stats?.played ?? 0) + (last === input.challengeId ? 0 : 1),
        wins:
          (stats?.wins ?? 0) + (input.won && last !== input.challengeId ? 1 : 0),
        currentStreak,
        maxStreak,
        distributionJson: JSON.stringify(distribution),
        lastChallengeId: input.challengeId,
      },
    })
    .run();
}

export async function getUserStats(userId: string) {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select()
      .from(pgSchema.userStats)
      .where(eq(pgSchema.userStats.userId, userId))
      .limit(1);
    const stats = rows[0];
    if (!stats) {
      return {
        played: 0,
        wins: 0,
        winPct: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0],
      };
    }
    const distribution = parseJsonArray<number>(stats.distributionJson);
    return {
      played: stats.played,
      wins: stats.wins,
      winPct: stats.played ? Math.round((stats.wins / stats.played) * 100) : 0,
      currentStreak: stats.currentStreak,
      maxStreak: stats.maxStreak,
      distribution,
    };
  }

  const db = getSqliteDb();
  const stats = db
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, userId))
    .get();
  if (!stats) {
    return {
      played: 0,
      wins: 0,
      winPct: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    };
  }
  const distribution = JSON.parse(stats.distributionJson) as number[];
  return {
    played: stats.played,
    wins: stats.wins,
    winPct: stats.played ? Math.round((stats.wins / stats.played) * 100) : 0,
    currentStreak: stats.currentStreak,
    maxStreak: stats.maxStreak,
    distribution,
  };
}

export async function getUserHistory(userId: string, limit = 30) {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select({
        challengeId: pgSchema.games.challengeId,
        status: pgSchema.games.status,
        guessesJson: pgSchema.games.guessesJson,
        completedAt: pgSchema.games.completedAt,
        date: pgSchema.dailyChallenges.date,
        difficulty: pgSchema.dailyChallenges.difficulty,
      })
      .from(pgSchema.games)
      .innerJoin(
        pgSchema.dailyChallenges,
        eq(pgSchema.games.challengeId, pgSchema.dailyChallenges.id),
      )
      .where(eq(pgSchema.games.userId, userId));

    return rows
      .sort((a, b) => b.challengeId - a.challengeId)
      .slice(0, limit)
      .map((r) => ({
        challengeId: r.challengeId,
        date: r.date,
        difficulty: r.difficulty,
        status: r.status,
        guesses: parseJsonArray<number>(r.guessesJson),
        completedAt: asIso(r.completedAt),
      }));
  }

  const db = getSqliteDb();
  const rows = db
    .select({
      challengeId: schema.games.challengeId,
      status: schema.games.status,
      guessesJson: schema.games.guessesJson,
      completedAt: schema.games.completedAt,
      date: schema.dailyChallenges.date,
      difficulty: schema.dailyChallenges.difficulty,
    })
    .from(schema.games)
    .innerJoin(
      schema.dailyChallenges,
      eq(schema.games.challengeId, schema.dailyChallenges.id),
    )
    .where(eq(schema.games.userId, userId))
    .all()
    .sort((a, b) => b.challengeId - a.challengeId)
    .slice(0, limit);

  return rows.map((r) => ({
    challengeId: r.challengeId,
    date: r.date,
    difficulty: r.difficulty,
    status: r.status,
    guesses: JSON.parse(r.guessesJson) as number[],
    completedAt: r.completedAt,
  }));
}

export async function getTodayLeaderboard(challengeId: number, limit = 20) {
  if (usePostgres()) {
    const rows = await getPgDb()
      .select({
        userId: pgSchema.games.userId,
        displayName: pgSchema.profiles.displayName,
        avatarUrl: pgSchema.profiles.avatarUrl,
        status: pgSchema.games.status,
        guessesJson: pgSchema.games.guessesJson,
        completedAt: pgSchema.games.completedAt,
        currentStreak: pgSchema.userStats.currentStreak,
        maxStreak: pgSchema.userStats.maxStreak,
        score: pgSchema.games.score,
        grade: pgSchema.games.grade,
        efficiency: pgSchema.games.efficiency,
        accuracy: pgSchema.games.accuracy,
      })
      .from(pgSchema.games)
      .innerJoin(
        pgSchema.profiles,
        eq(pgSchema.games.userId, pgSchema.profiles.id),
      )
      .leftJoin(
        pgSchema.userStats,
        eq(pgSchema.games.userId, pgSchema.userStats.userId),
      )
      .where(eq(pgSchema.games.challengeId, challengeId));

    return rows
      .filter((r) => r.status === "WON" || r.status === "LOST")
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName || "Trainer",
        avatarUrl: r.avatarUrl,
        status: r.status,
        guesses: parseJsonArray<number>(r.guessesJson).length,
        completedAt: asIso(r.completedAt),
        currentStreak: r.currentStreak ?? 0,
        maxStreak: r.maxStreak ?? 0,
        score: r.score ?? 0,
        grade: r.grade ?? "F",
        efficiency: r.efficiency ?? 0,
        accuracy: r.accuracy ?? 0,
      }))
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "WON" ? -1 : 1;
        }
        if (a.guesses !== b.guesses) return a.guesses - b.guesses;
        return (a.completedAt || "").localeCompare(b.completedAt || "");
      })
      .slice(0, limit);
  }

  const db = getSqliteDb();
  const rows = db
    .select({
      userId: schema.games.userId,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      status: schema.games.status,
      guessesJson: schema.games.guessesJson,
      completedAt: schema.games.completedAt,
      currentStreak: schema.userStats.currentStreak,
      maxStreak: schema.userStats.maxStreak,
      score: schema.games.score,
      grade: schema.games.grade,
      efficiency: schema.games.efficiency,
      accuracy: schema.games.accuracy,
    })
    .from(schema.games)
    .innerJoin(schema.profiles, eq(schema.games.userId, schema.profiles.id))
    .leftJoin(schema.userStats, eq(schema.games.userId, schema.userStats.userId))
    .where(eq(schema.games.challengeId, challengeId))
    .all()
    .filter((r) => r.status === "WON" || r.status === "LOST")
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName || "Trainer",
      avatarUrl: r.avatarUrl,
      status: r.status,
      guesses: (JSON.parse(r.guessesJson) as number[]).length,
      completedAt: r.completedAt,
      currentStreak: r.currentStreak ?? 0,
      maxStreak: r.maxStreak ?? 0,
      score: r.score ?? 0,
      grade: r.grade ?? "F",
      efficiency: r.efficiency ?? 0,
      accuracy: r.accuracy ?? 0,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "WON" ? -1 : 1;
      }
      if (a.guesses !== b.guesses) return a.guesses - b.guesses;
      return (a.completedAt || "").localeCompare(b.completedAt || "");
    })
    .slice(0, limit);

  return rows;
}
