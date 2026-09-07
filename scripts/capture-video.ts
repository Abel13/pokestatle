import { chromium } from "playwright";
import fs from "fs";

const OUT = "/opt/cursor/artifacts/pokestatle-guess-demo.webm";
fs.mkdirSync("/opt/cursor/artifacts", { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "/tmp/pw-video", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:43127/", { waitUntil: "networkidle" });
  await page.getByText("Discover today's Pokémon").waitFor();
  await page.waitForTimeout(600);
  const input = page.getByPlaceholder("Search a Pokémon...");
  await input.click();
  await input.fill("Bulbasaur");
  await page.getByRole("option").filter({ hasText: "Bulbasaur" }).first().click();
  await page.locator("table").waitFor();
  await page.waitForTimeout(1200);
  await input.fill("Gengar");
  await page.getByRole("option").filter({ hasText: "Gengar" }).first().click();
  await page.waitForTimeout(1500);
  await page.getByLabel("Toggle theme").click();
  await page.waitForTimeout(800);
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const path = await video.path();
    fs.copyFileSync(path, OUT);
    console.log("Video saved", OUT);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
