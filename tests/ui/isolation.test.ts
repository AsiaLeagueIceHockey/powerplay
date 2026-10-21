import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { artworkHashes, legacyClassHash, uiHash } from "../../scripts/ui-artwork";
import baseline from "../../docs/design-system-artwork-baseline.json";

describe("excluded renderers keep their appearance", () => {
  it.each(Object.entries(baseline.artwork))("preserves exported JSX artwork: %s", (path, hashes) => {
    expect(artworkHashes(readFileSync(path, "utf8"))).toEqual(hashes);
  });
  it("preserves the shared SEO About renderer's default classes", () => {
    expect(legacyClassHash(readFileSync("src/components/about-page-content.tsx", "utf8"))).toBe(baseline.aboutLegacyClasses);
  });
  it("does not change the pre-existing global HTML appearance rules", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(uiHash(css.split("/* PowerPlay UI tokens.")[0].trim())).toBe(baseline.globalAppearance);
  });
});
