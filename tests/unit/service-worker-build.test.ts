import { readFile } from "node:fs/promises";

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

import { matchesLocaleStartPath } from "@/lib/pwa-start-path";

describe("service worker build", () => {
  it("bundles the TypeScript worker as classic iOS and Android-compatible JavaScript", async () => {
    const result = await build({
      entryPoints: ["src/app/sw.ts"],
      bundle: true,
      platform: "browser",
      format: "iife",
      target: ["safari16.4", "chrome80"],
      minify: true,
      write: false,
    });
    const output = result.outputFiles[0]?.text ?? "";

    expect(output).toContain('addEventListener("push"');
    expect(output).toContain('addEventListener("notificationclick"');
    expect(output).toContain("app-start-page");
    expect(output).toContain("networkTimeoutSeconds:1");
    expect(output).not.toMatch(/\bimport\s*(?:\(|\{|type\b)/);
    expect(output).not.toContain("declare global");
    expect(output).not.toContain("ServiceWorkerGlobalScope");
  });

  it("keeps install-time precaching disabled for iOS push activation", async () => {
    const source = await readFile("src/app/sw.ts", "utf8");

    expect(source).toContain("precacheEntries: []");
    expect(source).not.toContain("precacheEntries: self.__SW_MANIFEST");
    expect(source).not.toContain("precacheEntries: self.__SW_MANIFEST ?? []");
  });

  it("keeps the manifest locale start URLs in the worker runtime-cache scope", async () => {
    expect(matchesLocaleStartPath("/ko")).toBe(true);
    expect(matchesLocaleStartPath("/ko/")).toBe(true);
    expect(matchesLocaleStartPath("/en")).toBe(true);
    expect(matchesLocaleStartPath("/en/")).toBe(true);
    expect(matchesLocaleStartPath("/")).toBe(false);
    expect(matchesLocaleStartPath("/ko/match/123")).toBe(false);
  });
});
