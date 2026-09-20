import { beforeEach, describe, expect, it, vi } from "vitest";

import { createChainableMock, mockSupabase, resetSupabaseMock } from "../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/app/actions/push", () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAndNotify: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { joinMatch, joinWaitlist } from "@/app/actions/match";

describe("past match registration guards", () => {
  const pastStartTime = "2020-01-01T00:00:00.000Z";
  let matchesQuery: ReturnType<typeof createChainableMock>;
  let participantsQuery: ReturnType<typeof createChainableMock>;

  beforeEach(() => {
    resetSupabaseMock();
    matchesQuery = createChainableMock();
    participantsQuery = createChainableMock();

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "matches") return matchesQuery;
      if (table === "participants") return participantsQuery;
      return createChainableMock();
    });

    participantsQuery.single.mockResolvedValue({ data: null });
    matchesQuery.single.mockResolvedValue({
      data: {
        id: "past-match",
        start_time: pastStartTime,
        status: "open",
        entry_points: 0,
        rental_fee: 0,
        rental_available: false,
        goalie_free: false,
        match_type: "training",
      },
    });
  });

  it("rejects a direct join attempt after the match has started", async () => {
    const result = await joinMatch("past-match", "FW");

    expect(result).toEqual({ error: "This match has already started" });
    expect(participantsQuery.insert).not.toHaveBeenCalled();
  });

  it("rejects a waitlist attempt after the match has started", async () => {
    const result = await joinWaitlist("past-match", "FW");

    expect(result).toEqual({ error: "This match has already started" });
    expect(participantsQuery.insert).not.toHaveBeenCalled();
  });
});
