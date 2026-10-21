import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";
import baseline from "../docs/design-system-baseline.json";

const output = resolve("artifacts/ui");
mkdirSync(output, { recursive: true });
const tests = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--maxWorkers=2", "--reporter=json", `--outputFile=${output}/full-tests.json`], { encoding: "utf8" });
writeFileSync(`${output}/full-tests.log`, tests.stdout + tests.stderr);
const lint = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", "src", "scripts", "tests", "--format=json", `--output-file=${output}/full-lint.json`], { encoding: "utf8" });
writeFileSync(`${output}/full-lint.log`, lint.stdout + lint.stderr);
type TestFile = { name: string; status: string; assertionResults: { fullName: string; status: string }[] };
const report: { numTotalTests: number; numFailedTests: number; testResults: TestFile[] } = JSON.parse(readFileSync(`${output}/full-tests.json`, "utf8"));
const failedTests = report.testResults.flatMap(file => file.assertionResults.filter(test => test.status === "failed").map(test => ({ file: relative(process.cwd(), file.name), name: test.fullName })));
const baselineTests = new Set(baseline.tests.failures.map(test => `${test.file}:${test.name}`));
const newTests = failedTests.filter(test => !baselineTests.has(`${test.file}:${test.name}`));
// Fail closed on a collection/startup error that produced no individual assertion failure.
const collectionErrors = report.testResults.filter(file => file.status === "failed" && !file.assertionResults.some(test => test.status === "failed"));
type LintFile = { filePath: string; messages: { severity: number; ruleId: string | null; message: string; line?: number }[] };
const lintReport: LintFile[] = JSON.parse(readFileSync(`${output}/full-lint.json`, "utf8"));
const errors = lintReport.flatMap(file => file.messages.filter(message => message.severity === 2).map(message => ({ file: relative(process.cwd(), file.filePath), rule: message.ruleId, message: message.message, source: readFileSync(file.filePath, "utf8").split("\n")[(message.line || 1) - 1]?.trim() || "" })));
const identity = (entry: { file: string; rule: string | null; message: string; source: string }) => JSON.stringify([entry.file, entry.rule, entry.message, entry.source.trim()]);
const baselineErrors = new Set(baseline.lint.errors.map(identity));
const newErrors = errors.filter(error => !baselineErrors.has(identity(error)));
const result = { tests: { total: report.numTotalTests, failed: failedTests, newFailures: newTests, collectionErrors }, lint: { existingErrors: errors.length - newErrors.length, newErrors }, processErrors: [tests.error?.message, lint.error?.message].filter(Boolean) };
writeFileSync(`${output}/baseline-comparison.json`, JSON.stringify(result, null, 2) + "\n");
console.log(`Full suite: ${report.numTotalTests} tests, ${failedTests.length} baseline failures, ${newTests.length} new failures. Lint: ${errors.length} existing errors, ${newErrors.length} new errors.`);
if (newTests.length || collectionErrors.length || newErrors.length || result.processErrors.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
}
