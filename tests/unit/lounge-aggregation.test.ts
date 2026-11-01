import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.stubEnv("DELETE_OLD_LOGS", "true");
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function setup() {
  const cursor = vi.fn().mockResolvedValue({ data: [], error: null });
  const raw = vi.fn().mockResolvedValue({ data: [{
    business_id: "business-1", event_id: null, entity_type: "business",
    metric_type: "impression", cta_type: null, source: "direct",
    created_at: "2026-10-31T14:00:00Z",
  }], error: null });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const deleteLogs = vi.fn().mockReturnValue({ lt: vi.fn().mockResolvedValue({ count: 1, error: null }) });
  const dailyQuery = {
    select: () => dailyQuery, order: () => dailyQuery, limit: cursor, upsert,
  };
  const rawQuery = {
    select: () => rawQuery, lte: () => rawQuery, gt: () => rawQuery,
    order: () => rawQuery, range: raw, delete: deleteLogs,
  };
  mocks.createClient.mockReturnValue({
    from: (table: string) => table === "lounge_daily_metrics" ? dailyQuery : rawQuery,
  });
  return { cursor, raw, upsert, deleteLogs };
}

async function runScript() {
  await import("../../scripts/aggregate-lounge-metrics");
  await vi.dynamicImportSettled();
}

describe("lounge aggregation failure reporting", () => {
  it("finishes aggregation before allowing optional log cleanup", async () => {
    const { upsert, deleteLogs } = setup();
    await runScript();
    expect(upsert).toHaveBeenCalled();
    expect(deleteLogs).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it("does not treat a failed cursor query as an empty database", async () => {
    const { cursor, raw, deleteLogs } = setup();
    cursor.mockResolvedValue({ data: null, error: { message: "cursor unavailable" } });
    await runScript();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(raw).not.toHaveBeenCalled();
    expect(deleteLogs).not.toHaveBeenCalled();
  });

  it("does not write a partial aggregate when a later query page fails", async () => {
    const { raw, upsert, deleteLogs } = setup();
    const row = { business_id: "business-1", created_at: "2026-10-31T14:00:00Z", metric_type: "impression" };
    raw.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => row), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "page unavailable" } });
    await runScript();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(upsert).not.toHaveBeenCalled();
    expect(deleteLogs).not.toHaveBeenCalled();
  });

  it("stops before cleanup when a daily upsert fails", async () => {
    const { upsert, deleteLogs } = setup();
    upsert.mockResolvedValue({ error: { message: "write unavailable" } });
    await runScript();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(deleteLogs).not.toHaveBeenCalled();
  });
});
