/** Resolve challenge date from `?date=YYYY-MM-DD` or bare `?YYYY-MM-DD`. */
export function resolveChallengeDateParam(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  const named = searchParams.get("date");
  if (named && /^\d{4}-\d{2}-\d{2}$/.test(named)) return named;
  for (const key of searchParams.keys()) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  }
  return null;
}
