/**
 * Apply score columns migration to Supabase
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { getDatabaseUrl } from "../src/lib/db";

async function main() {
  const url = getDatabaseUrl();

  if (!url) {
    console.error(
      "Missing Postgres URL. Set DATABASE_URL, POSTGRES_URL, or STORAGE_POSTGRES_URL.",
    );
    process.exit(1);
  }

  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20260908000000_add_score_columns.sql",
  );

  if (!fs.existsSync(migrationPath)) {
    console.error("Migration file not found:", migrationPath);
    process.exit(1);
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
    console.log("[migration] Applying score columns migration...");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    await sql.unsafe(migrationSql);
    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("[migration] Failed:", err);
  process.exit(1);
});
