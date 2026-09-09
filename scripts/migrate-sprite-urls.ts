import "dotenv/config";
import { getSqliteDb, schema } from "../src/lib/db";
import { getPgDb, pgSchema, usePostgres } from "../src/lib/db";
import { convertGitHubUrlToJsDelivr } from "../src/lib/pokemon/sprite-url";
import { eq } from "drizzle-orm";

async function migrateSprites() {
  console.log("Starting sprite URL migration to jsDelivr CDN...");
  
  let updated = 0;
  let skipped = 0;

  if (usePostgres()) {
    console.log("Using PostgreSQL/Supabase database");
    const db = getPgDb();
    const pokemon = await db.select().from(pgSchema.pokemon);
    
    console.log(`Found ${pokemon.length} Pokemon to check`);
    
    for (const p of pokemon) {
      const newSprite = convertGitHubUrlToJsDelivr(p.sprite);
      if (newSprite !== p.sprite) {
        await db
          .update(pgSchema.pokemon)
          .set({ sprite: newSprite })
          .where(eq(pgSchema.pokemon.id, p.id));
        updated++;
        if (updated % 100 === 0) {
          console.log(`Updated ${updated} sprites...`);
        }
      } else {
        skipped++;
      }
    }
  } else {
    console.log("Using SQLite database");
    const db = getSqliteDb();
    const pokemon = db.select().from(schema.pokemon).all();
    
    console.log(`Found ${pokemon.length} Pokemon to check`);
    
    for (const p of pokemon) {
      const newSprite = convertGitHubUrlToJsDelivr(p.sprite);
      if (newSprite !== p.sprite) {
        db.update(schema.pokemon)
          .set({ sprite: newSprite })
          .where(eq(schema.pokemon.id, p.id))
          .run();
        updated++;
        if (updated % 100 === 0) {
          console.log(`Updated ${updated} sprites...`);
        }
      } else {
        skipped++;
      }
    }
  }

  console.log("\n=== Migration Summary ===");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already jsDelivr): ${skipped}`);
  console.log(`Total: ${updated + skipped}`);
  console.log("\n✅ Migration complete!");
}

migrateSprites()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
