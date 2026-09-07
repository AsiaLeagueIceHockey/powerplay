import { readFile } from "node:fs/promises";

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

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
    expect(output).not.toMatch(/\bimport\s*(?:\(|\{|type\b)/);
    expect(output).not.toContain("declare global");
    expect(output).not.toContain("ServiceWorkerGlobalScope");
  });

  it("keeps install-time precaching disabled for iOS push activation", async () => {
    const source = await readFile("src/app/sw.ts", "utf8");

    expect(source).toContain("precacheEntries: []");
  });
});
