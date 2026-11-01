import { describe, expect, it } from "vitest";
import { resolveRankingMonth } from "../../scripts/lib/automation-dates";

describe("monthly ranking target", () => {
  it.each([
    ["2026-10-31T14:59:59Z", "2026-09"],
    ["2026-10-31T15:00:00Z", "2026-10"],
    ["2026-11-01T00:17:00Z", "2026-10"],
    ["2026-11-02T03:00:00Z", "2026-10"],
    ["2026-12-31T15:00:00Z", "2026-12"],
    ["2028-03-01T00:17:00Z", "2028-02"],
  ])("uses the completed KST month at %s", (instant, expected) => {
    expect(resolveRankingMonth(undefined, new Date(instant))).toBe(expected);
  });

  it("allows October regeneration after month-end, independently of the run date", () => {
    expect(resolveRankingMonth(" 2026-10 ", new Date("2027-01-01T00:00:00Z"))).toBe("2026-10");
  });

  it("treats blank manual input like the schedule", () => {
    expect(resolveRankingMonth("  ", new Date("2026-11-01T00:17:00Z"))).toBe("2026-10");
  });

  it.each(["2026-00", "2026-13", "2026-1", "2026-10-01", "invalid"]) (
    "rejects invalid input %s before accessing the database", (input) => {
      expect(() => resolveRankingMonth(input)).toThrow("Invalid TARGET_MONTH");
    },
  );
});
