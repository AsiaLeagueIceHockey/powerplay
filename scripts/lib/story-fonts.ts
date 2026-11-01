import type { Page } from "playwright";

/** A ready FontFaceSet alone also succeeds when every glyph uses an OS fallback. */
export async function waitForStoryFonts(page: Page): Promise<void> {
  await page.locator("[data-instagram-story]").waitFor({ state: "visible" });
  await page.evaluate(async () => {
    const story = document.querySelector("[data-instagram-story]");
    const scope = story?.closest<HTMLElement>("[data-instagram-font]");
    const family = scope?.dataset.instagramFont;
    if (!story || !family) {
      throw new Error("Capture page is missing the bundled Instagram font");
    }

    // Load the real Korean and Latin faces at every weight used by story text.
    const sample = "응원 랭킹 아이스하키 38표 TOP 5 PowerPlay";
    for (const weight of [400, 500, 600, 700, 900]) {
      const faces = await document.fonts.load(`${weight} 44px ${family}`, sample);
      if (faces.length === 0 || faces.some((face) => face.status !== "loaded")) {
        throw new Error(`Instagram font did not load at weight ${weight}`);
      }
    }
    await document.fonts.ready;
  });
}
