import { NextResponse } from "next/server";
import { headers } from "next/headers";
import postgres from "postgres";
import { getDatabaseUrl, usePostgres } from "@/lib/db";
import { SPRITE_URL_PREFIXES } from "@/lib/pokemon/sprite-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Production-safe sprite URL backfill (GitHub raw → jsDelivr).
 * Trigger:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://pokestatle.vercel.app/api/cron/migrate-sprites
 */
export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (process.env.VERCEL_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET is required in production" },
        { status: 500 },
      );
    }

    if (!usePostgres()) {
      return NextResponse.json({
        success: false,
        error: "Postgres is not configured in this environment",
        action: "skipped",
      });
    }

    const url = getDatabaseUrl();
    if (!url) {
      return NextResponse.json(
        { error: "Missing Postgres URL" },
        { status: 500 },
      );
    }

    const isLocal =
      url.includes("127.0.0.1") ||
      url.includes("localhost") ||
      url.includes("@db:");

    const sql = postgres(url, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: isLocal ? false : "require",
    });

    try {
      const before = await sql`
        select
          count(*)::int as total,
          count(*) filter (where sprite like ${SPRITE_URL_PREFIXES.github + "%"})::int as github,
          count(*) filter (where sprite like ${SPRITE_URL_PREFIXES.jsdelivr + "%"})::int as jsdelivr,
          count(*) filter (where sprite is null or sprite = '')::int as empty
        from public.pokemon
      `;

      const updated = await sql`
        update public.pokemon
        set sprite = replace(
          sprite,
          ${SPRITE_URL_PREFIXES.github},
          ${SPRITE_URL_PREFIXES.jsdelivr}
        )
        where sprite like ${SPRITE_URL_PREFIXES.github + "%"}
      `;

      // Also repair empty sprites from id
      const repaired = await sql`
        update public.pokemon
        set sprite = ${SPRITE_URL_PREFIXES.jsdelivr}
          || '/sprites/pokemon/other/official-artwork/'
          || id::text
          || '.png'
        where sprite is null or sprite = ''
      `;

      const after = await sql`
        select
          count(*)::int as total,
          count(*) filter (where sprite like ${SPRITE_URL_PREFIXES.github + "%"})::int as github,
          count(*) filter (where sprite like ${SPRITE_URL_PREFIXES.jsdelivr + "%"})::int as jsdelivr,
          count(*) filter (where sprite is null or sprite = '')::int as empty
        from public.pokemon
      `;

      return NextResponse.json({
        success: true,
        action: "migrated",
        updated: updated.count,
        repairedEmpty: repaired.count,
        before: before[0],
        after: after[0],
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/migrate-sprites]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
