import { describe, expect, it } from "vitest";
import { createDefaultPetSnapshot, normalizePetState, getActionAvailability, applyFeedAction, applyTrainAction, getKstDateKey } from "@/lib/tamagotchi-state";

const userId = "user-1";
const locale = "ko" as const;

describe("tamagotchi state", () => {
  it("applies soft decay per 12 hour window", () => {
    const pet = createDefaultPetSnapshot(new Date("2026-04-01T00:00:00.000Z"));
    const normalized = normalizePetState(pet, new Date("2026-04-02T00:00:00.000Z"));
    expect(normalized.windows).toBe(2);
    expect(normalized.snapshot.energy).toBe(60);
    expect(normalized.snapshot.condition).toBe(68);
  });

  it("keeps same-day revisit read-only after both actions", () => {
    const now = new Date("2026-04-01T03:00:00.000Z");
    const base = createDefaultPetSnapshot(now);
    const trained = applyTrainAction({ snapshot: base, locale, now, userId }).snapshot;
    const fed = applyFeedAction({ snapshot: trained, locale, now, userId }).snapshot;
    const availability = getActionAvailability(fed, now);
    expect(availability.canFeed).toBe(false);
    expect(availability.canTrain).toBe(false);
    expect(availability.visitMode).toBe("read_only");
  });

  it("unlocks a pending special meal only on some training days", () => {
    const now = new Date("2026-04-03T03:00:00.000Z");
    const trained = applyTrainAction({ snapshot: createDefaultPetSnapshot(now), locale, now, userId });
    expect(trained.snapshot.lastTrainingKey).toBeTruthy();
    expect(trained.snapshot.lastTrainedAt).toBe(now.toISOString());
  });

  it("uses KST date keys for gating", () => {
    const pet = createDefaultPetSnapshot(new Date("2026-04-01T03:30:00.000Z"));
    const dayKey = getKstDateKey(new Date("2026-04-01T03:30:00.000Z"));
    expect(dayKey).toBe("2026-04-01");
    const feed = applyFeedAction({ snapshot: pet, locale, now: new Date("2026-04-01T03:30:00.000Z"), userId });
    expect(() => applyFeedAction({ snapshot: feed.snapshot, locale, now: new Date("2026-04-01T04:00:00.000Z"), userId })).toThrow(/already/i);
  });
});
