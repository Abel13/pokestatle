import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(OUT, { recursive: true });

async function shoot(width: number, name: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: width < 500 ? 900 : 900 },
  });
  await page.goto("http://127.0.0.1:43127/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Discover today's Pokémon").waitFor();

  const input = page.getByPlaceholder("Search a Pokémon...");
  await input.click();
  await input.fill("Charizard");
  await page.getByRole("option").filter({ hasText: "Charizard" }).first().click();
  await page.getByText("Charizard", { exact: true }).first().waitFor();
  await page.waitForTimeout(700);
  await input.fill("Gengar");
  await page.getByRole("option").filter({ hasText: "Gengar" }).first().click();
  await page.waitForTimeout(900);

  await page.screenshot({
    path: path.join(OUT, name),
    fullPage: true,
  });
  await browser.close();
}

async function main() {
  await shoot(390, "pokestatle-cards-mobile.png");
  await shoot(1280, "pokestatle-cards-desktop.png");
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
