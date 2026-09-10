import { chromium, type BrowserContext, type Page } from "playwright";

type Mode = "cold" | "warm-pwa";

type RunMetrics = {
  ttfbMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  domContentLoadedMs: number | null;
  loadMs: number | null;
  documentEncodedBytes: number;
  documentDecodedBytes: number;
  totalTransferBytes: number;
  jsTransferBytes: number;
  jsRequestCount: number;
  requestCount: number;
  failedRequests: string[];
  serviceWorker: "unsupported" | "unregistered" | "installing" | "waiting" | "active";
};

type Summary = {
  mode: Mode;
  runs: RunMetrics[];
  median: RunMetrics;
};

const url = process.env.PERF_URL ?? "https://powerplay.kr/ko";
const shouldAssert = process.argv.includes("--assert");
const runs = 5;
const budgets = {
  fcpMs: 1800,
  lcpMs: 2500,
  documentEncodedBytes: 45_000,
  jsTransferBytes: 220_000,
  jsRequestCount: 12,
  ttfbMs: 300,
};

async function configurePage(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 93_750,
    connectionType: "cellular4g",
  });
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.addInitScript(() => {
    const metrics = { fcp: null as number | null, lcp: null as number | null };
    window.__powerPlayStartupMetrics = metrics;

    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) metrics.fcp = entry.startTime;
    }).observe({ type: "paint", buffered: true });

    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
}

async function collectMetrics(page: Page, failedRequests: string[]): Promise<RunMetrics> {
  return page.evaluate((failures) => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const allEntries = [navigation, ...resources].filter(
      (entry): entry is PerformanceResourceTiming | PerformanceNavigationTiming => Boolean(entry),
    );
    const jsEntries = resources.filter((entry) => entry.initiatorType === "script");
    const metrics = window.__powerPlayStartupMetrics;
    const registration = "serviceWorker" in navigator ? undefined : null;

    return {
      ttfbMs: navigation ? navigation.responseStart : null,
      fcpMs: metrics.fcp,
      lcpMs: metrics.lcp,
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : null,
      loadMs: navigation ? navigation.loadEventEnd : null,
      documentEncodedBytes: navigation?.encodedBodySize ?? 0,
      documentDecodedBytes: navigation?.decodedBodySize ?? 0,
      totalTransferBytes: allEntries.reduce((total, entry) => total + entry.transferSize, 0),
      jsTransferBytes: jsEntries.reduce((total, entry) => total + entry.transferSize, 0),
      jsRequestCount: jsEntries.length,
      requestCount: allEntries.length,
      failedRequests: failures,
      serviceWorker: registration === null ? "unsupported" : "unregistered",
    };
  }, failedRequests);
}

async function navigationMetrics(context: BrowserContext): Promise<RunMetrics> {
  const page = await context.newPage();
  const failedRequests: string[] = [];
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${new URL(request.url()).pathname}`));
  await configurePage(page);
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(2_000);
  const metrics = await collectMetrics(page, failedRequests);
  metrics.serviceWorker = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "unsupported" as const;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "unregistered" as const;
    if (registration.active) return "active" as const;
    if (registration.waiting) return "waiting" as const;
    return "installing" as const;
  });
  await page.close();
  return metrics;
}

async function measureCold(): Promise<RunMetrics> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    return await navigationMetrics(context);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function measureWarmPwa(): Promise<RunMetrics> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    const firstPage = await context.newPage();
    await configurePage(firstPage);
    await firstPage.goto(url, { waitUntil: "load", timeout: 60_000 });
    await firstPage.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(resolve, 10_000)),
        ]);
      }
    });
    await firstPage.close();
    return await navigationMetrics(context);
  } finally {
    await context.close();
    await browser.close();
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function medianMetrics(mode: Mode, measurements: RunMetrics[]): Summary {
  const keys = Object.keys(measurements[0] ?? {}) as (keyof RunMetrics)[];
  const result = {} as RunMetrics;
  for (const key of keys) {
    const values = measurements.map((measurement) => measurement[key]);
    if (typeof values[0] === "number") {
      result[key] = median(values as number[]) as never;
    } else if (typeof values[0] === "object") {
      result[key] = values[Math.floor(values.length / 2)] as never;
    } else {
      result[key] = values[Math.floor(values.length / 2)] as never;
    }
  }
  return { mode, runs: measurements, median: result };
}

function assertBudgets(summary: Summary): string[] {
  const failures: string[] = [];
  const { median: result } = summary;
  for (const [key, budget] of Object.entries(budgets) as [keyof typeof budgets, number][]) {
    const value = result[key];
    if (typeof value === "number" && value > budget) {
      failures.push(`${summary.mode}: ${key} ${value} exceeds ${budget}`);
    }
  }
  return failures;
}

async function main(): Promise<void> {
  const results: Summary[] = [];
  for (const mode of ["cold", "warm-pwa"] as const) {
    const measurements: RunMetrics[] = [];
    for (let run = 0; run < runs; run += 1) {
      measurements.push(mode === "cold" ? await measureCold() : await measureWarmPwa());
    }
    results.push(medianMetrics(mode, measurements));
  }

  console.log(JSON.stringify({ url, throttling: "4G (150ms/200KBps), CPU 4x", results }, null, 2));
  const failures = shouldAssert ? results.flatMap(assertBudgets) : [];
  if (failures.length > 0) {
    console.error(`PWA performance budgets failed:\n${failures.join("\n")}`);
    process.exitCode = 1;
  }
}

const keepAlive = setInterval(() => undefined, 1_000);
void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));

declare global {
  interface Window {
    __powerPlayStartupMetrics: { fcp: number | null; lcp: number | null };
  }
}
