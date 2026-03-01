import { describe, it, expect } from "vitest";
import {
  generateMatchDates,
  groupMatchesByPattern,
  getWeekOfMonth,
  matchesWeeklyOption,
  type SchedulePattern,
} from "@/lib/bulk-match-utils";

// ─── getWeekOfMonth ──────────────────────────────────────

describe("getWeekOfMonth", () => {
  it("2026-03-01 (Sun) → week 1", () => {
    expect(getWeekOfMonth(new Date(2026, 2, 1))).toBe(1);
  });

  it("2026-03-02 (Mon) → week 2 (Mon starts new week)", () => {
    // March 1 is Sun → Mon-based: Mon Mar 2 starts week 2
    expect(getWeekOfMonth(new Date(2026, 2, 2))).toBe(2);
  });

  it("2026-03-08 (Sun) → week 2", () => {
    expect(getWeekOfMonth(new Date(2026, 2, 8))).toBe(2);
  });

  it("2026-03-15 (Sun) → week 3", () => {
    expect(getWeekOfMonth(new Date(2026, 2, 15))).toBe(3);
  });

  it("2026-03-31 (Tue) → week 6", () => {
    expect(getWeekOfMonth(new Date(2026, 2, 31))).toBe(6);
  });
});

// ─── matchesWeeklyOption ─────────────────────────────────

describe("matchesWeeklyOption", () => {
  it('"every" always matches', () => {
    expect(matchesWeeklyOption(new Date(2026, 2, 1), "every")).toBe(true);
    expect(matchesWeeklyOption(new Date(2026, 2, 15), "every")).toBe(true);
  });

  it('"week13" matches weeks 1 and 3 only', () => {
    // Week 1: Mar 1 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 1), "week13")).toBe(true);
    // Week 2: Mar 2 (Mon)
    expect(matchesWeeklyOption(new Date(2026, 2, 2), "week13")).toBe(false);
    // Week 3: Mar 15 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 15), "week13")).toBe(true);
  });

  it('"week24" matches weeks 2 and 4 only', () => {
    // Week 2: Mar 8 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 8), "week24")).toBe(true);
    // Week 3: Mar 15 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 15), "week24")).toBe(false);
    // Week 4: Mar 22 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 22), "week24")).toBe(true);
  });

  it('"custom" matches specified weeks', () => {
    // Week 1: Mar 1 (Sun)
    expect(matchesWeeklyOption(new Date(2026, 2, 1), "custom", [1, 5])).toBe(true);
    // Week 5: Mar 29 (Sun) - Mon-based: (29 + 6) / 7 = 5
    expect(matchesWeeklyOption(new Date(2026, 2, 29), "custom", [1, 5])).toBe(true);
    // Week 2: Mar 2 (Mon)
    expect(matchesWeeklyOption(new Date(2026, 2, 2), "custom", [1, 5])).toBe(false);
    // Week 6: Mar 31 (Tue)
    expect(matchesWeeklyOption(new Date(2026, 2, 31), "custom", [1, 6])).toBe(true);
  });
});

// ─── generateMatchDates ──────────────────────────────────

describe("generateMatchDates", () => {
  const baseGamePattern: SchedulePattern = {
    id: "test-1",
    rinkId: "rink-suwon",
    daysOfWeek: [2, 4], // Tue, Thu
    hour: "22",
    minute: "00",
    weeklyOption: "every",
    matchType: "game",
    entryPoints: 25000,
    bankAccount: "카카오뱅크 3333-00-1234567",
    maxSkaters: 20,
    maxGoalies: 2,
    goalieFree: true,
    rentalAvailable: true,
    rentalFee: 10000,
    description: "정규 대관",
  };

  it("generates correct count for every Tue/Thu in March 2026", () => {
    // March 2026: Tue = 3,10,17,24,31 (5), Thu = 5,12,19,26 (4) → 9 total
    const results = generateMatchDates(2026, 3, baseGamePattern);
    expect(results).toHaveLength(9);
  });

  it("generates correct dates for every Tuesday in March 2026", () => {
    const tuOnly = { ...baseGamePattern, daysOfWeek: [2] };
    const results = generateMatchDates(2026, 3, tuOnly);
    expect(results.map((r) => r.date)).toEqual([
      "2026-03-03",
      "2026-03-10",
      "2026-03-17",
      "2026-03-24",
      "2026-03-31",
    ]);
  });

  it("sets correct startTime format", () => {
    const results = generateMatchDates(2026, 3, baseGamePattern);
    expect(results[0].startTime).toBe("2026-03-03T22:00");
  });

  it("applies game fields correctly", () => {
    const results = generateMatchDates(2026, 3, baseGamePattern);
    const first = results[0];
    expect(first.matchType).toBe("game");
    expect(first.entryPoints).toBe(25000);
    expect(first.maxSkaters).toBe(20);
    expect(first.maxGoalies).toBe(2);
    expect(first.goalieFree).toBe(true);
    expect(first.rentalAvailable).toBe(true);
    expect(first.rentalFee).toBe(10000);
    expect(first.bankAccount).toBe("카카오뱅크 3333-00-1234567");
    expect(first.maxGuests).toBeNull();
  });

  it("handles training type correctly", () => {
    const trainingPattern: SchedulePattern = {
      id: "test-2",
      rinkId: "rink-bundang",
      daysOfWeek: [5], // Fri
      hour: "22",
      minute: "30",
      weeklyOption: "every",
      matchType: "training",
      entryPoints: 15000,
      bankAccount: "국민은행 1234-5678",
      maxGuests: 10,
      rentalAvailable: true,
      rentalFee: 5000,
    };

    const results = generateMatchDates(2026, 3, trainingPattern);
    const first = results[0];
    expect(first.matchType).toBe("training");
    expect(first.entryPoints).toBe(15000);
    expect(first.maxGuests).toBe(10);
    expect(first.maxSkaters).toBe(10); // synced to maxGuests
    expect(first.maxGoalies).toBe(0);
    expect(first.goalieFree).toBe(false);
  });

  it("handles team_match type correctly", () => {
    const teamPattern: SchedulePattern = {
      id: "test-3",
      rinkId: "rink-gwanggyo",
      daysOfWeek: [0], // Sun
      hour: "10",
      minute: "30",
      weeklyOption: "every",
      matchType: "team_match",
    };

    const results = generateMatchDates(2026, 3, teamPattern);
    const first = results[0];
    expect(first.matchType).toBe("team_match");
    expect(first.entryPoints).toBe(0);
    expect(first.bankAccount).toBeNull();
    expect(first.maxSkaters).toBe(1);
    expect(first.maxGoalies).toBe(0);
    expect(first.goalieFree).toBe(false);
    expect(first.rentalAvailable).toBe(false);
    expect(first.rentalFee).toBe(0);
    expect(first.maxGuests).toBeNull();
  });

  it("handles week13 option (1·3주)", () => {
    const pattern: SchedulePattern = {
      ...baseGamePattern,
      daysOfWeek: [0], // Sun
      weeklyOption: "week13",
    };
    const results = generateMatchDates(2026, 3, pattern);
    // March 2026 Sundays: 1(W1), 8(W2), 15(W3), 22(W4), 29(W5)
    // Week 1 & 3: Mar 1, Mar 15
    expect(results.map((r) => r.date)).toEqual(["2026-03-01", "2026-03-15"]);
  });

  it("handles week24 option (2·4주)", () => {
    const pattern: SchedulePattern = {
      ...baseGamePattern,
      daysOfWeek: [0], // Sun
      weeklyOption: "week24",
    };
    const results = generateMatchDates(2026, 3, pattern);
    // Week 2 & 4: Mar 8, Mar 22
    expect(results.map((r) => r.date)).toEqual(["2026-03-08", "2026-03-22"]);
  });

  it("handles custom weeks option", () => {
    const pattern: SchedulePattern = {
      ...baseGamePattern,
      daysOfWeek: [0], // Sun
      weeklyOption: "custom",
      customWeeks: [1, 5],
    };
    const results = generateMatchDates(2026, 3, pattern);
    // Week 1: Mar 1 (Sun), Week 5: Mar 29 (Sun)
    expect(results.map((r) => r.date)).toEqual(["2026-03-01", "2026-03-29"]);
  });

  it("returns empty array for empty daysOfWeek", () => {
    const pattern: SchedulePattern = { ...baseGamePattern, daysOfWeek: [] };
    expect(generateMatchDates(2026, 3, pattern)).toEqual([]);
  });

  // ─── Suwon Eagles Example Schedule ───
  it("generates full Suwon Eagles monthly schedule", () => {
    const patterns: SchedulePattern[] = [
      {
        id: "suwon-tu-th",
        rinkId: "rink-suwon",
        daysOfWeek: [2, 4], // Tue, Thu
        hour: "22",
        minute: "00",
        weeklyOption: "every",
        matchType: "game",
        entryPoints: 25000,
        bankAccount: "카뱅 3333",
        maxSkaters: 20,
        maxGoalies: 2,
      },
      {
        id: "suwon-fri",
        rinkId: "rink-bundang",
        daysOfWeek: [5], // Fri
        hour: "22",
        minute: "30",
        weeklyOption: "every",
        matchType: "training",
        entryPoints: 15000,
        bankAccount: "카뱅 3333",
        maxGuests: 10,
      },
      {
        id: "suwon-sun-13",
        rinkId: "rink-suwon",
        daysOfWeek: [0], // Sun
        hour: "22",
        minute: "00",
        weeklyOption: "week13",
        matchType: "game",
        entryPoints: 25000,
        bankAccount: "카뱅 3333",
        maxSkaters: 20,
        maxGoalies: 2,
      },
      {
        id: "suwon-sun-24",
        rinkId: "rink-gwanggyo",
        daysOfWeek: [0], // Sun
        hour: "10",
        minute: "30",
        weeklyOption: "week24",
        matchType: "game",
        entryPoints: 20000,
        bankAccount: "카뱅 3333",
        maxSkaters: 20,
        maxGoalies: 2,
      },
    ];

    const allMatches = patterns.flatMap((p) => generateMatchDates(2026, 3, p));

    // Tue(5) + Thu(4) + Fri(4) + Sun-W1,W3(2) + Sun-W2,W4(2) = 17
    expect(allMatches.length).toBe(17);

    // Verify all Sun matches don't overlap
    const sunMatches = allMatches.filter((m) => m.dayOfWeek === 0);
    expect(sunMatches).toHaveLength(4);
    const sunDates = sunMatches.map((m) => m.date);
    expect(new Set(sunDates).size).toBe(4); // no duplicates
  });
});

// ─── groupMatchesByPattern ───────────────────────────────

describe("groupMatchesByPattern", () => {
  it("groups matches with same settings into one pattern", () => {
    // 4 Tuesday matches at same rink/time
    const matches = [
      createPrevMatch("2026-02-03T13:00:00.000Z", "rink-1", "game"), // Tue 22:00 KST
      createPrevMatch("2026-02-10T13:00:00.000Z", "rink-1", "game"),
      createPrevMatch("2026-02-17T13:00:00.000Z", "rink-1", "game"),
      createPrevMatch("2026-02-24T13:00:00.000Z", "rink-1", "game"),
    ];

    const patterns = groupMatchesByPattern(matches);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].daysOfWeek).toEqual([2]); // Tuesday
    expect(patterns[0].hour).toBe("22");
    expect(patterns[0].minute).toBe("00");
    expect(patterns[0].rinkId).toBe("rink-1");
    expect(patterns[0].matchType).toBe("game");
  });

  it("separates different rinks into different patterns", () => {
    const matches = [
      createPrevMatch("2026-02-03T13:00:00.000Z", "rink-1", "game"),
      createPrevMatch("2026-02-05T13:00:00.000Z", "rink-2", "game"),
    ];

    const patterns = groupMatchesByPattern(matches);
    expect(patterns).toHaveLength(2);
  });

  it("separates different match types into different patterns", () => {
    const matches = [
      createPrevMatch("2026-02-03T13:00:00.000Z", "rink-1", "game"),
      createPrevMatch("2026-02-03T13:30:00.000Z", "rink-1", "training"),
    ];

    const patterns = groupMatchesByPattern(matches);
    expect(patterns).toHaveLength(2);
  });

  it("returns empty for empty input", () => {
    expect(groupMatchesByPattern([])).toEqual([]);
  });
});

// ─── Helpers ─────────────────────────────────────────────

function createPrevMatch(
  startTimeUtc: string,
  rinkId: string,
  matchType: "game" | "training" | "team_match"
) {
  return {
    rink_id: rinkId,
    start_time: startTimeUtc,
    match_type: matchType,
    entry_points: 25000,
    rental_fee: 10000,
    rental_available: true,
    bank_account: "카뱅 3333",
    max_skaters: 20,
    max_goalies: 2,
    max_guests: null,
    goalie_free: false,
    description: null,
  };
}
