import Database from "better-sqlite3";
import { join } from "path";
import { existsSync } from "fs";

const dbPath = join(process.cwd(), "data", "pokestatle.db");

if (!existsSync(dbPath)) {
  console.log("❌ Database file not found at:", dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  console.log("🔄 Adding score columns to games table...");

  // Check if columns already exist
  const tableInfo = db.pragma("table_info(games)");
  const existingColumns = tableInfo.map((col: any) => col.name);

  const columnsToAdd = [
    { name: "score", type: "INTEGER" },
    { name: "grade", type: "TEXT" },
    { name: "efficiency", type: "INTEGER" },
    { name: "accuracy", type: "INTEGER" },
  ];

  for (const column of columnsToAdd) {
    if (existingColumns.includes(column.name)) {
      console.log(`✓ Column '${column.name}' already exists`);
    } else {
      db.exec(`ALTER TABLE games ADD COLUMN ${column.name} ${column.type}`);
      console.log(`✅ Added column '${column.name}'`);
    }
  }

  console.log("✅ Migration completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
