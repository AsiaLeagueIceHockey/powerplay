import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { waitForStoryFonts } from "./lib/story-fonts";

// Runs on the same Linux runner as the scheduled captures, without production
// credentials, OS Korean fonts, external CDNs, uploads, or Slack messages.
async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const font = await readFile("public/fonts/pretendard/PretendardVariable.woff2");
    await page.route("https://story-font.test/**", async (route) => {
      if (route.request().url().endsWith(".woff2")) {
        await route.fulfill({ contentType: "font/woff2", body: font });
        return;
      }
      await route.fulfill({ contentType: "text/html", body: `
        <meta charset="utf-8">
      <style>
          @font-face { font-family: "PowerPlay Story"; src: url("/font.woff2"); font-weight: 100 900; }
          h3 { font-family: "PowerPlay Story"; font-weight: 900; }
        </style>
        <div data-instagram-font='"PowerPlay Story"'>
          <div data-instagram-story><h3>팀 리슬로 응원 랭킹 38표 RE:SLO</h3></div>
        </div>` });
    });
    await page.goto("https://story-font.test/");
    await waitForStoryFonts(page);
  
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "h3" });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    assert(fonts.length > 0, "No rendered font found");
    assert(fonts.every((face) => face.isCustomFont && face.familyName.includes("Pretendard")),
      `Korean/Latin glyphs fell back to OS fonts: ${JSON.stringify(fonts)}`);
    console.log("Story Korean and Latin glyphs use bundled Pretendard:", fonts);
  
    await page.locator("[data-instagram-font]").evaluate((element) => {
      (element as HTMLElement).dataset.instagramFont = '"Missing Story Font"';
    });
    await assert.rejects(waitForStoryFonts(page), /Instagram font did not load/);
    console.log("Missing webfont correctly blocks capture.");
  } finally {
    await browser.close();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
