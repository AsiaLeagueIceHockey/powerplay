// Before/after screenshots of public routes, following the CLAUDE.md verification safety rule:
// a fresh logged-out context, and every request other than GET/HEAD is aborted (server actions,
// tracking and Supabase writes never leave the browser). Never point this at a logged-in session.
//
// Usage (dev server on :3200):
//   node scripts/ui-route-shots.mjs <label> [route ...]
//   node scripts/ui-route-shots.mjs before /ko/clubs /ko/rinks "/ko?tab=match"
// Output: artifacts/ui/routes/<label>-<route-slug>-<shot>.png (git-ignored)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , label, ...routeArgs] = process.argv;
if (!label) throw new Error("usage: node scripts/ui-route-shots.mjs <label> [route ...]");
const base = process.env.UI_BASE_URL || "http://localhost:3200";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Route shots must run against a local dev server");
const routes = routeArgs.length ? routeArgs : ["/ko/clubs"];
const out = "artifacts/ui/routes";
mkdirSync(out, { recursive: true });

// [id, width, height, scheme, scrollToBottom]
const shots = [
  ["390-light", 390, 1500, "light", false],
  ["390-dark", 390, 1500, "dark", false],
  ["1280-light", 1280, 1400, "light", false],
  ["390-light-bottom", 390, 1100, "light", true],
];

const browser = await chromium.launch();
const blocked = new Set();
for (const route of routes) {
  const slug = route.replace(/^\/+/, "").replace(/[^\w-]+/g, "_") || "root";
  for (const [id, width, height, scheme, bottom] of shots) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, deviceScaleFactor: 2, locale: "ko-KR" });
    await context.addCookies([{ name: "NEXT_LOCALE", value: route.startsWith("/en") ? "en" : "ko", url: base }]);
    await context.route("**/*", (request) => {
      const method = request.request().method();
      if (method === "GET" || method === "HEAD") return request.continue();
      blocked.add(`${method} ${new URL(request.request().url()).pathname}`);
      return request.abort();
    });
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => {});
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForTimeout(1500);
    if (bottom) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: `${out}/${label}-${slug}-${id}.png` });
    await context.close();
  }
}
await browser.close();
console.log(`saved ${label} shots for ${routes.join(", ")} in ${out}`);
if (blocked.size) console.log("blocked non-GET:", [...blocked].join(", "));
