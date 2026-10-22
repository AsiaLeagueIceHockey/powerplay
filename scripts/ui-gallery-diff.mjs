// Deterministic capture of the DB-free fixture gallery (/dev/design-system) and a pixel diff between
// two captures. Transitions/animations are disabled before capturing, so the same CSS always yields
// identical images (`npm run ui:visual` captures mid-transition and is not pixel-stable).
//
// Usage (dev server on :3200):
//   node scripts/ui-gallery-diff.mjs capture <dir>
//   node scripts/ui-gallery-diff.mjs diff <dirA> <dirB>
// To compare against committed CSS: stash the change, restart the dev server, capture A,
// pop the stash, restart, capture B, then diff.
import { chromium } from "playwright";
import { mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

const [, , command, a, b] = process.argv;
const base = process.env.UI_BASE_URL || "http://localhost:3200";

if (command === "capture" && a) {
  mkdirSync(a, { recursive: true });
  const browser = await chromium.launch();
  for (const width of [390, 1280]) for (const theme of ["powerplay", "lounge", "youth"]) for (const mode of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: mode });
    await page.goto(`${base}/dev/design-system`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important} nextjs-portal{display:none!important}" });
    await page.getByTestId("theme").selectOption(theme);
    await page.getByTestId("mode").selectOption(mode);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${a}/${theme}-${mode}-${width}.png`, fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log("captured", a);
} else if (command === "diff" && a && b) {
  const changed = [];
  for (const file of readdirSync(a).filter((f) => f.endsWith(".png"))) {
    const [x, y] = await Promise.all([sharp(`${a}/${file}`).raw().toBuffer({ resolveWithObject: true }), sharp(`${b}/${file}`).raw().toBuffer({ resolveWithObject: true })]);
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) { changed.push(`${file} size ${x.info.height}->${y.info.height}`); continue; }
    let differing = 0;
    for (let i = 0; i < x.data.length; i++) if (Math.abs(x.data[i] - y.data[i]) > 8) differing++;
    if (differing) changed.push(`${file} px:${differing}`);
  }
  console.log(`differing: ${changed.length}`);
  if (changed.length) console.log(changed.join("\n"));
  process.exitCode = changed.length ? 1 : 0;
} else {
  throw new Error("usage: node scripts/ui-gallery-diff.mjs capture <dir> | diff <dirA> <dirB>");
}
