"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ShareResultButton } from "@/components/game/share-result-button";
import { SilhouetteCanvas } from "@/components/scale/silhouette-canvas";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatHeightMeters,
  formatScaleShareText,
  letterGradeScale,
} from "@/lib/game/scale-score";
import {
  loadScaleGameState,
  saveScaleGameState,
} from "@/lib/game/scale-storage";
import { formatResizeShareUrl } from "@/lib/game/modes";
import {
  MAX_SCALE_TOTAL,
  SCALE_ROUNDS,
  type ScaleChallengePublic,
  type ScaleGameState,
  type ScaleRoundResult,
} from "@/lib/game/scale-types";

function heightBounds(referenceHeightDm: number) {
  const min = Math.max(1, Math.round(referenceHeightDm * 0.05));
  const max = Math.max(min + 1, Math.round(referenceHeightDm * 40));
  return { min, max };
}

function offByPercent(guessDm: number, realDm: number) {
  if (!Number.isFinite(realDm) || realDm <= 0) return 0;
  return Math.round((Math.abs(guessDm - realDm) / realDm) * 100);
}

function resultFlavor(total: number) {
  const avg = total / SCALE_ROUNDS;
  if (avg >= 85) return "Sharp eye. You’re sizing these up like a pro.";
  if (avg >= 60) return "Solid read. A few more rounds and it’ll click.";
  if (avg >= 40) return "A tricky set. Keep training your eye for scale.";
  return "Tough day. Come back tomorrow and recalibrate.";
}

/** Ease-out count from 0 → target (or snap when play is false). */
function useCountUp(
  target: number,
  play: boolean,
  replayKey: string | number,
  durationMs = 1000,
) {
  const [value, setValue] = useState(play ? 0 : target);

  useEffect(() => {
    if (!play) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const start = performance.now();
    const easeOut = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, play, replayKey, durationMs]);

  return value;
}

export function ScaleBoard({ date: dateProp }: { date?: string | null } = {}) {
  const [challenge, setChallenge] = useState<ScaleChallengePublic | null>(null);
  const [state, setState] = useState<ScaleGameState | null>(null);
  const [guessHeightDm, setGuessHeightDm] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundFlash, setRoundFlash] = useState<ScaleRoundResult | null>(null);
  /** When set, canvas shows that completed pair's result. */
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const dateQuery =
    dateProp && /^\d{4}-\d{2}-\d{2}$/.test(dateProp)
      ? `?date=${dateProp}`
      : "";

  const currentIndex = state?.rounds.length ?? 0;
  const isComplete = state?.status === "COMPLETE";
  /** Keep Lock In reveal on the play canvas until the score finishes counting. */
  const showFinalCard = isComplete && !roundFlash;

  const lockInKey = roundFlash
    ? `${roundFlash.roundIndex}-${roundFlash.score}`
    : "idle";
  const lockInScoreTarget = roundFlash?.score ?? 0;
  const animatedLockInScore = useCountUp(
    lockInScoreTarget,
    Boolean(roundFlash),
    lockInKey,
    1100,
  );
  const animatedTotalScore = useCountUp(
    state?.totalScore ?? 0,
    showFinalCard,
    state?.completedAt ?? `total-${state?.challengeId ?? 0}`,
    1200,
  );

  // After the last Lock In count-up, open the final results card.
  useEffect(() => {
    if (!roundFlash || state?.status !== "COMPLETE") return;
    const t = window.setTimeout(() => setRoundFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [roundFlash, state?.status]);

  const displayRoundIndex =
    reviewIndex != null
      ? reviewIndex
      : roundFlash
        ? roundFlash.roundIndex
        : isComplete
          ? SCALE_ROUNDS - 1
          : currentIndex;
  const displayRound = challenge?.rounds[displayRoundIndex] ?? null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setRoundFlash(null);
      setReviewIndex(null);
      try {
        const [todayRes, meRes] = await Promise.all([
          fetch(`/api/scale/today${dateQuery}`),
          fetch(`/api/scale/me/today${dateQuery}`),
        ]);
        const todayData = await todayRes.json();
        if (!todayRes.ok) throw new Error(todayData.error || "Failed to load");

        let challengePayload = todayData as ScaleChallengePublic;
        let gameState: ScaleGameState | null = null;

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.game) {
            gameState = meData.game as ScaleGameState;
            if (meData.challenge) {
              challengePayload = meData.challenge as ScaleChallengePublic;
            }
          }
        }

        if (!gameState) {
          gameState = loadScaleGameState(challengePayload.date);
        }

        if (!gameState) {
          gameState = {
            challengeId: challengePayload.challengeId,
            date: challengePayload.date,
            rounds: [],
            totalScore: 0,
            status: "PLAYING",
          };
        }

        if (gameState.rounds.length > 0) {
          challengePayload = {
            ...challengePayload,
            rounds: challengePayload.rounds.map((r) => {
              const result = gameState!.rounds.find(
                (x) => x.roundIndex === r.roundIndex,
              );
              if (!result) return r;
              return {
                ...r,
                targetHeightDm: result.realHeightDm,
                result,
              };
            }),
          };
        }

        setChallenge(challengePayload);
        setState(gameState);
        saveScaleGameState(gameState);

        if (gameState.status === "COMPLETE" && gameState.rounds.length > 0) {
          setReviewIndex(0);
        }

        const nextRound =
          challengePayload.rounds[gameState.rounds.length] ??
          challengePayload.rounds[0];
        if (nextRound) {
          setGuessHeightDm(nextRound.reference.heightDm);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [dateQuery]);

  const bounds = useMemo(() => {
    if (!displayRound) return { min: 1, max: 100 };
    return heightBounds(displayRound.reference.heightDm);
  }, [displayRound]);

  useEffect(() => {
    if (!displayRound || roundFlash || reviewIndex != null || displayRound.result)
      return;
    setGuessHeightDm((prev) => {
      const { min, max } = heightBounds(displayRound.reference.heightDm);
      if (prev < min || prev > max) return displayRound.reference.heightDm;
      return prev;
    });
  }, [displayRound, roundFlash, reviewIndex]);

  const onConfirm = useCallback(async () => {
    if (!challenge || !state || state.status === "COMPLETE" || submitting) {
      return;
    }
    const roundIndex = state.rounds.length;
    if (roundIndex >= SCALE_ROUNDS) return;

    setSubmitting(true);
    setError(null);
    setReviewIndex(null);
    try {
      const res = await fetch("/api/scale/today/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: challenge.date,
          roundIndex,
          guessHeightDm,
          previousRounds: state.rounds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Guess failed");

      const nextState: ScaleGameState = {
        challengeId: data.challengeId,
        date: data.date,
        rounds: data.rounds,
        totalScore: data.totalScore,
        status: data.status,
        completedAt: data.completedAt,
      };
      setState(nextState);
      saveScaleGameState(nextState);
      setChallenge(data.publicChallenge);
      setRoundFlash(data.round);
      if (nextState.status === "COMPLETE") {
        setReviewIndex(data.round.roundIndex);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guess failed");
    } finally {
      setSubmitting(false);
    }
  }, [challenge, state, submitting, guessHeightDm]);

  const onNextRound = useCallback(() => {
    setRoundFlash(null);
    setReviewIndex(null);
    if (!challenge || !state) return;
    const next = challenge.rounds[state.rounds.length];
    if (next) setGuessHeightDm(next.reference.heightDm);
  }, [challenge, state]);

  const selectRound = useCallback(
    (index: number) => {
      if (!state?.rounds.some((r) => r.roundIndex === index)) return;
      setRoundFlash(null);
      setReviewIndex(index);
    },
    [state],
  );

  const shareText = useMemo(() => {
    if (!state) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const siteUrl = origin
      ? formatResizeShareUrl(origin, state.date)
      : undefined;
    return formatScaleShareText({
      scores: state.rounds.map((r) => r.score),
      totalScore: state.totalScore,
      siteUrl,
    });
  }, [state]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="mx-auto h-8 w-56" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!challenge || !state || !displayRound) return null;

  const reviewedResult =
    reviewIndex != null
      ? state.rounds.find((r) => r.roundIndex === reviewIndex)
      : null;

  const activeResult =
    reviewedResult ??
    roundFlash ??
    displayRound.result ??
    state.rounds.find((r) => r.roundIndex === displayRound.roundIndex);

  const viewingResult =
    Boolean(activeResult) &&
    (Boolean(roundFlash) || isComplete || reviewIndex != null);

  const guessDm = viewingResult
    ? (activeResult?.guessHeightDm ?? guessHeightDm)
    : guessHeightDm;
  const interactive =
    !viewingResult && !submitting && !isComplete && reviewIndex == null;

  const canAdvance =
    state.status === "PLAYING" &&
    state.rounds.length > 0 &&
    state.rounds.length < SCALE_ROUNDS &&
    (Boolean(roundFlash) || reviewIndex != null);

  const offPct =
    activeResult != null
      ? offByPercent(activeResult.guessHeightDm, activeResult.realHeightDm)
      : 0;

  const canvasBlock = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm",
        isComplete
          ? "h-[200px] w-full sm:h-[230px]"
          : "h-[min(58vh,420px)] sm:h-[440px]",
      )}
    >
      <div className="h-full w-full">
        <SilhouetteCanvas
          reference={{
            src: displayRound.reference.sprite,
            heightDm: displayRound.reference.heightDm,
            color: "#0f766e",
          }}
          guess={{
            src: displayRound.target.sprite,
            heightDm: guessDm,
            color: "#0369a1",
          }}
          reveal={
            viewingResult && activeResult
              ? {
                  src: displayRound.target.sprite,
                  heightDm: activeResult.realHeightDm,
                  color: "#94a3b8",
                  opacity: 0.45,
                }
              : null
          }
          guessHeightDm={guessDm}
          onGuessHeightChange={setGuessHeightDm}
          heightMin={bounds.min}
          heightMax={bounds.max}
          interactive={interactive}
        />
      </div>

      {/* Metadata after Lock In — score counts up from 0. */}
      {viewingResult && activeResult && (!showFinalCard || roundFlash) ? (
        <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-[min(100%,15.5rem)] animate-in fade-in-0 zoom-in-95 duration-300 rounded-xl border border-border/60 bg-background/95 px-3.5 py-3 shadow-md backdrop-blur-sm">
          <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-teal-700 dark:text-teal-300">
            {roundFlash ? animatedLockInScore : activeResult.score}{" "}
            <span className="text-base font-medium text-muted-foreground">
              / 100
            </span>
          </p>
          <dl className="mt-2 space-y-0.5 text-[13px] leading-snug">
            <div className="flex flex-wrap gap-x-1">
              <dt className="text-muted-foreground">Your Answer:</dt>
              <dd className="font-medium text-foreground">
                {formatHeightMeters(activeResult.guessHeightDm)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-1">
              <dt className="text-muted-foreground">Actual:</dt>
              <dd className="font-medium text-foreground">
                {formatHeightMeters(activeResult.realHeightDm)}{" "}
                <span className="font-normal text-muted-foreground">
                  (height)
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            Off by {offPct}%
          </p>
        </div>
      ) : null}
    </div>
  );

  const roundsList = (
    <div className="flex flex-col">
      <p className="mb-3 text-sm font-semibold text-foreground">Your rounds</p>
      <ul className="space-y-3" role="listbox" aria-label="Round results">
        {Array.from({ length: SCALE_ROUNDS }, (_, i) => {
          const done = state.rounds.find((x) => x.roundIndex === i);
          const selected = displayRoundIndex === i && Boolean(done);
          const fill = done ? Math.max(4, done.score) : 0;
          return (
            <li key={i}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!done}
                onClick={() => selectRound(i)}
                className={cn(
                  "group flex w-full items-center gap-3 text-left transition",
                  !done && "cursor-default opacity-45",
                  done && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "w-16 shrink-0 font-mono text-[11px] tracking-wide uppercase",
                    selected
                      ? "font-semibold text-teal-700 dark:text-teal-300"
                      : "text-muted-foreground",
                  )}
                >
                  Round {i + 1}
                </span>
                <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  {done ? (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-teal-600 transition-all dark:bg-teal-400"
                      style={{ width: `${fill}%` }}
                    />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "w-8 shrink-0 text-right font-mono text-sm tabular-nums",
                    selected
                      ? "font-semibold text-teal-700 dark:text-teal-300"
                      : "text-muted-foreground",
                  )}
                >
                  {done ? done.score : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Select a round to see your guess.
      </p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
      {!showFinalCard ? (
        <>
          <div className="flex items-center justify-center gap-6 font-mono text-xs tracking-wide text-muted-foreground uppercase sm:text-sm">
            <span>
              Round {Math.min(displayRoundIndex + 1, SCALE_ROUNDS)} /{" "}
              {SCALE_ROUNDS}
            </span>
            <span>Score {state.totalScore}</span>
          </div>

          {canvasBlock}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Reference: </span>
                <span className="font-semibold text-teal-700 dark:text-teal-300">
                  {displayRound.reference.name}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  ({formatHeightMeters(displayRound.reference.heightDm)})
                </span>
              </p>
              <p>
                <span className="font-semibold text-sky-700 dark:text-sky-300">
                  {displayRound.target.name}
                </span>
                <span className="text-muted-foreground">
                  {viewingResult ? (
                    <> — your guess vs actual size</>
                  ) : (
                    <> ({formatHeightMeters(guessHeightDm)} — drag the handle)</>
                  )}
                </span>
              </p>
            </div>

            {!viewingResult ? (
              <Button
                type="button"
                size="lg"
                className="w-full shrink-0 sm:w-auto sm:min-w-[9rem]"
                onClick={() => void onConfirm()}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Lock In"
                )}
              </Button>
            ) : null}

            {canAdvance ? (
              <Button
                type="button"
                size="lg"
                className="w-full shrink-0 sm:w-auto sm:min-w-[9rem]"
                onClick={onNextRound}
              >
                Next pair
              </Button>
            ) : null}

            {reviewIndex != null &&
            state.status === "PLAYING" &&
            !roundFlash ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => {
                  setReviewIndex(null);
                  const next = challenge.rounds[state.rounds.length];
                  if (next) setGuessHeightDm(next.reference.heightDm);
                }}
              >
                Back to play
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border/70 bg-background px-4 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 sm:grid-cols-[minmax(12rem,0.75fr)_minmax(0,1.4fr)] sm:items-start">
            {roundsList}
            {canvasBlock}
          </div>

          <div className="space-y-3 border-t border-border/60 pt-5 text-center">
            <p className="font-heading text-5xl font-semibold tabular-nums tracking-tight text-teal-700 dark:text-teal-300">
              {animatedTotalScore}
            </p>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Out of {MAX_SCALE_TOTAL}
            </p>
            <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal-600 transition-[width] duration-75 dark:bg-teal-400"
                style={{
                  width: `${Math.max(2, (animatedTotalScore / MAX_SCALE_TOTAL) * 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {resultFlavor(state.totalScore)}
            </p>
            <p className="text-xs text-muted-foreground">
              Grade{" "}
              <span className="font-semibold text-foreground">
                {letterGradeScale(state.totalScore)}
              </span>
              <span>
                {" "}
                · Resize them #{challenge.challengeId}
              </span>
            </p>
            <ShareResultButton
              className="mx-auto mt-1 max-w-md"
              text={shareText}
              title="Pokéstatle: Resize them"
              challengeId={challenge.challengeId}
            />
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
