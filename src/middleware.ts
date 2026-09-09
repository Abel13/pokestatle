import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Public API paths that do not need a Supabase session refresh.
 * Skipping auth here avoids an extra round-trip on the hot challenge path.
 */
function isPublicApiPath(pathname: string): boolean {
  if (pathname === "/api/challenges/today") return true;
  if (/^\/api\/challenges\/\d{4}-\d{2}-\d{2}$/.test(pathname)) return true;
  if (pathname.startsWith("/api/pokemon/")) return true;
  if (pathname.startsWith("/api/leaderboard/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  if (isPublicApiPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
