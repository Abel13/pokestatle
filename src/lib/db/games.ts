import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { GuessResult } from "@/lib/game/types";

export async function ensureProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const db = getDb();
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
  const db = getDb();
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

  if (existing) {
    db.update(schema.games)
      .set({
        status,
        guessesJson: JSON.stringify(guesses),
        resultsJson: JSON.stringify(results),
        completedAt,
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
      })
      .run();
  }

  if (status === "WON" || status === "LOST") {
    updateStatsOnComplete({
      userId: input.userId,
      challengeId: input.challengeId,
      won: input.won,
      guessCount: guesses.length,
    });
  }
}

function updateStatsOnComplete(input: {
  userId: string;
  challengeId: number;
  won: boolean;
  guessCount: number;
}) {
  const db = getDb();
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

export function getUserStats(userId: string) {
  const db = getDb();
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

export function getUserHistory(userId: string, limit = 30) {
  const db = getDb();
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

export function getTodayLeaderboard(challengeId: number, limit = 20) {
  const db = getDb();
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
    })
    .from(schema.games)
    .innerJoin(schema.profiles, eq(schema.games.userId, schema.profiles.id))
    .leftJoin(schema.userStats, eq(schema.games.userId, schema.userStats.userId))
    .where(eq(schema.games.challengeId, challengeId))
    .all()
    .filter((r) => r.status === "WON")
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName || "Trainer",
      avatarUrl: r.avatarUrl,
      guesses: (JSON.parse(r.guessesJson) as number[]).length,
      completedAt: r.completedAt,
      currentStreak: r.currentStreak ?? 0,
      maxStreak: r.maxStreak ?? 0,
    }))
    .sort((a, b) => {
      if (a.guesses !== b.guesses) return a.guesses - b.guesses;
      return (a.completedAt || "").localeCompare(b.completedAt || "");
    })
    .slice(0, limit);

  return rows;
}
