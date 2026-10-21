import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { inspectUiSource, type UiExceptions } from "./ui-policy";
import policy from "./ui-policy.json";

let failures = 0;
// Newly added or changed user UI cannot silently fall outside the explicit inventory.
const changed = spawnSync("git", ["diff", "--name-only", process.env.UI_BASE_REF || "origin/main", "--", "src"], { encoding: "utf8" });
const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard", "src"], { encoding: "utf8" });
const inventory = new Set(Object.keys(policy.files));
for (const path of new Set((changed.stdout + "\n" + untracked.stdout).trim().split("\n"))) {
  if (!path.endsWith(".tsx") || /\/\(admin\)\/|\/seo-bot\//.test(path)) continue;
  if (!inventory.has(path)) { console.error(`${path}: classify changed UI in scripts/ui-policy.json`); failures++; }
}
for (const [path, exceptions] of Object.entries(policy.files)) {
  for (const issue of inspectUiSource(readFileSync(path, "utf8"), exceptions as UiExceptions)) {
    console.error(`${path}:${issue.line} ${issue.rule}: ${issue.message}`);
    failures++;
  }
}
if (failures) {
  console.error(`${failures} UI policy violations`);
  process.exitCode = 1;
} else {
  console.log(`UI policy passed for ${Object.keys(policy.files).length} migrated files`);
  const result = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", ...Object.keys(policy.files), "scripts/ui-policy.ts", "scripts/ui-check.ts", "scripts/ui-visual.ts", "scripts/ui-baseline.ts", "tests/ui"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
}
