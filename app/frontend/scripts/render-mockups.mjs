// Draws each mockup in spec/screens/ to the picture beside it, so the pictures never lag the HTML.
// npm run mockups               every screen
// npm run mockups -- <id> ...   only these screens
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = fileURLToPath(new URL("../../../spec/screens/", import.meta.url));
const only = process.argv.slice(2);
const ids = only.length
  ? only
  : readdirSync(dir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => file.slice(0, -".html".length));

const browser = await chromium.launch();
// The mockup board is 2826 px wide: phone, tablet and laptop side by side.
const page = await browser.newPage({ viewport: { width: 2826, height: 900 } });
for (const id of ids) {
  await page.goto("file://" + path.join(dir, id + ".html"));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dir, id + ".jpg"), fullPage: true, type: "jpeg", quality: 80 });
  console.log(`spec/screens/${id}.jpg`);
}
await browser.close();
