import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

  await page.goto("http://127.0.0.1:43127/", { waitUntil: "networkidle" });
  await page.getByText("Discover today's Pokémon").waitFor({ timeout: 15000 });
  await page.screenshot({
    path: path.join(OUT, "pokestatle-home.png"),
    fullPage: true,
  });

  const input = page.getByPlaceholder("Search a Pokémon...");
  await input.click();
  await input.fill("Pikachu");
  await page.getByRole("option").filter({ hasText: "Pikachu" }).first().click();
  await page.locator("table").waitFor({ timeout: 10000 });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "pokestatle-guess-feedback.png"),
    fullPage: true,
  });

  await page.getByLabel("Toggle theme").click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "pokestatle-dark.png"),
    fullPage: true,
  });

  await page.goto("http://127.0.0.1:43127/stats", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Stats" }).waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT, "pokestatle-stats.png"),
    fullPage: true,
  });

  await page.goto("http://127.0.0.1:43127/leaderboard", {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { name: /ranking/i }).waitFor();
  await page.screenshot({
    path: path.join(OUT, "pokestatle-leaderboard.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("OK", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
