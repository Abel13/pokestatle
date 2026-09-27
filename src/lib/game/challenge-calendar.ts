/** Challenge calendar uses America/Sao_Paulo so the daily reset matches Brazil. */
export const CHALLENGE_TIMEZONE = "America/Sao_Paulo";

/** Day 1 of PokéStatle numbering. */
export const EPOCH_DATE = "2026-01-01";

export function getChallengeDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHALLENGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Add calendar days to a YYYY-MM-DD challenge date (UTC date arithmetic). */
export function addChallengeDays(date: string, days: number): string {
  const d = parseDateOnly(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function challengeIdFromDate(date: string): number {
  const epoch = parseDateOnly(EPOCH_DATE).getTime();
  const current = parseDateOnly(date).getTime();
  const days = Math.floor((current - epoch) / 86_400_000) + 1;
  return Math.max(1, days);
}

/** Calendar month containing `today` (YYYY-MM-DD), capped at today for in-progress months. */
export function getChallengeMonthBounds(today = getChallengeDate()): {
  yearMonth: string;
  startDate: string;
  endDate: string;
} {
  const [y, m] = today.split("-").map(Number);
  const yearMonth = `${y}-${String(m).padStart(2, "0")}`;
  const startDate = `${yearMonth}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return {
    yearMonth,
    startDate,
    endDate: monthEnd > today ? today : monthEnd,
  };
}
