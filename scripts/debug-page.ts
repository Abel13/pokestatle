import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  page.on("requestfailed", (r) =>
    console.log("FAIL", r.url(), r.failure()?.errorText),
  );
  await page.goto("http://127.0.0.1:43127/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  console.log("TITLE", await page.title());
  console.log("BODY", (await page.locator("body").innerText()).slice(0, 2000));
  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/debug-home.png",
    fullPage: true,
  });
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
