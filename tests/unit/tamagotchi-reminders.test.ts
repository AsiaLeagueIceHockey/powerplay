import { describe, expect, it } from "vitest";
import { buildReminderSchedule, buildTamagotchiReminderDedupeKey, buildTamagotchiReminderPayload, mapReminderSendStatus } from "@/lib/tamagotchi-reminders";

describe("tamagotchi reminders", () => {
  it("builds one dedupe key per user/day window", () => {
    expect(buildTamagotchiReminderDedupeKey("user-1", "2026-04-01")).toBe("user-1:2026-04-01:daily-return");
  });

  it("schedules reminders about 8 hours later", () => {
    const scheduled = buildReminderSchedule(new Date("2026-04-01T00:00:00.000Z"));
    expect(scheduled).toBe("2026-04-01T08:00:00.000Z");
  });

  it("builds locale-aware payload", () => {
    expect(buildTamagotchiReminderPayload("ko").url).toBe("/ko/mypage/tamagotchi");
    expect(buildTamagotchiReminderPayload("en").url).toBe("/en/mypage/tamagotchi");
  });

  it("maps missing subscriptions to skipped for honest status", () => {
    expect(mapReminderSendStatus({ success: false, error: "No subscriptions" })).toEqual({
      status: "skipped",
      errorMessage: "No active push subscription",
    });
  });
});
