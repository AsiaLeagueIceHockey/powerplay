import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium } from "playwright";

async function main() {
  const base = process.env.UI_BASE_URL || "http://localhost:3100";
  assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "UI fixtures must run locally");
  let server: ChildProcess | undefined;
  const output = process.env.UI_VISUAL_OUTPUT || "artifacts/ui";
  await mkdir(output, { recursive: true });
  if (!process.env.UI_BASE_URL) {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", "3100"], { stdio: "pipe", env: { ...process.env, NODE_ENV: "development" } });
  }
  const browser = await chromium.launch({ headless: true });
  const results: object[] = [];
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { ready = (await fetch(`${base}/dev/design-system`)).ok; } catch { /* Server is still starting. */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert(ready, "Development fixture server did not become ready");
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      for (const theme of ["powerplay", "lounge", "youth"]) for (const locale of ["ko", "en"]) for (const mode of ["light", "dark"]) {
        const page = await browser.newPage({ viewport, colorScheme: mode as "light" | "dark" });
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
        await page.goto(`${base}/dev/design-system`);
        await page.getByTestId("theme").selectOption(theme);
        await page.getByTestId("locale").selectOption(locale);
        await page.getByTestId("mode").selectOption(mode);
        const measures = await page.evaluate(() => {
          const sizes = Array.from(document.querySelectorAll("button")).filter(button => ["36px", "44px", "56px"].includes(button.textContent || "")).map(button => button.getBoundingClientRect().height);
          const main = document.querySelector("main")!;
          return { width: document.documentElement.scrollWidth, viewport: innerWidth, sizes, accent: getComputedStyle(main).getPropertyValue("--pp-accent").trim(), sectionAccent: getComputedStyle(main).getPropertyValue("--pp-section-accent").trim(), background: getComputedStyle(main).backgroundColor };
        });
        assert(measures.width <= measures.viewport, `Horizontal overflow: ${theme}/${locale}/${mode}/${viewport.width}`);
        assert.deepEqual(measures.sizes, [36, 44, 56]);
        // One brand accent everywhere; sections only change their badge/icon/accent-line color.
        assert.equal(measures.accent, "#2563eb");
        if (theme !== "powerplay") assert.equal(measures.sectionAccent, { lounge: "#d4a017", youth: "#7c3aed" }[theme]);
        assert.equal(measures.background, mode === "dark" ? "rgb(9, 9, 11)" : "rgb(250, 250, 250)");
        assert.equal(await page.locator('[aria-invalid="true"]').count(), 1);
        assert.equal(await page.locator('button[aria-busy="true"]:disabled').count(), 1);
        await page.getByRole("button", { name: locale === "ko" ? "선택됨" : "Selected", exact: true }).click();
        assert.equal(await page.getByRole("button", { name: locale === "ko" ? "선택됨" : "Selected", exact: true }).getAttribute("aria-pressed"), "true");
        const id = `${theme}-${locale}-${mode}-${viewport.width}`;
        await page.screenshot({ path: `${output}/${id}.png`, fullPage: true });
        await page.getByRole("button", { name: "Modal", exact: true }).click();
        assert.equal(await page.getByRole("dialog").getAttribute("aria-labelledby"), "gallery-dialog-title");
        await page.getByRole("dialog").getByRole("button", { name: locale === "ko" ? "닫기" : "Close", exact: true }).first().click();
        assert.equal(await page.getByRole("dialog").count(), 0);
        const focus = page.getByRole("button", { name: "primary", exact: true });
        // The modal was just closed with a mouse click; switch to keyboard modality first so
        // Chromium's :focus-visible heuristic applies to the programmatic focus below.
        await page.keyboard.press("Shift");
        await focus.focus();
        assert.equal(await focus.evaluate(element => getComputedStyle(element).outlineWidth), "2px");
        await page.keyboard.press("Tab");
        assert(await page.evaluate(() => document.activeElement?.tagName === "BUTTON"));
        assert.deepEqual(errors, [], `${id}: console/runtime errors`);
        results.push({ id, ...measures, errors });
        await page.close();
      }
    }
    await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2) + "\n");
    console.log(`Gallery visual checks passed: ${results.length} combinations; screenshots in ${output}`);
  } finally {
    await browser.close();
    server?.kill();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
