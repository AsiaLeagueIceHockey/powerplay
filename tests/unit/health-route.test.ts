import { describe, expect, it, vi } from "vitest";

import { createHealthResponse } from "@/app/api/health/route";
import { checkHealth } from "@/lib/health";

describe("health check", () => {
  it("returns a no-store 200 response for a healthy database", async () => {
    const response = createHealthResponse({ database: "ok", durationMs: 12, timestamp: "2026-09-10T00:00:00.000Z", version: "test-release" });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    await expect(response.json()).resolves.toMatchObject({ status: "ok", version: "test-release", checks: { app: "ok", database: "ok" } });
  });

  it("returns a safe 503 response for an unavailable database", async () => {
    const response = createHealthResponse({ database: "error", durationMs: 12, timestamp: "2026-09-10T00:00:00.000Z", version: "local" });
    expect(response.status).toBe(503);
    await expect(response.text()).resolves.not.toContain("secret");
  });

  it("does not expose connection details from a database failure", async () => {
    const result = await checkHealth({ now: () => 100, queryDatabase: vi.fn().mockRejectedValue(new Error("https://secret.example/token")) });
    expect(result).toEqual({ database: "error", durationMs: 0 });
    expect(JSON.stringify(result)).not.toContain("secret.example");
  });
});
