import { beforeEach, describe, expect, it, vi } from "vitest";

const matchesQuery = {
  select: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn(),
};

const participantsQuery = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  eq: vi.fn(),
};

const supabase = {
  from: vi.fn((table: string) => {
    if (table === "matches") return matchesQuery;
    if (table === "participants") return participantsQuery;
    throw new Error(`Unexpected table: ${table}`);
  }),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => supabase),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => unknown) => callback,
}));

import { getPublicHomeMatches } from "@/lib/public-matches";

describe("getPublicHomeMatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps past matches available for calendar history", async () => {
    matchesQuery.order.mockResolvedValue({
      data: [
        {
          id: "past-match",
          start_time: "2026-08-15T11:00:00.000Z",
          status: "open",
          rink: { id: "rink-1", name_ko: "과거 링크장", name_en: "Past Rink" },
          club: null,
        },
        {
          id: "future-match",
          start_time: "2026-10-15T11:00:00.000Z",
          status: "open",
          rink: { id: "rink-2", name_ko: "미래 링크장", name_en: "Future Rink" },
          club: null,
        },
      ],
      error: null,
    });
    participantsQuery.eq.mockResolvedValue({ data: [], error: null });

    const matches = await getPublicHomeMatches();

    expect(matches.map((match) => match.id)).toEqual(["past-match", "future-match"]);
    expect(matchesQuery.neq).toHaveBeenCalledWith("status", "canceled");
    expect(matchesQuery.order).toHaveBeenCalledWith("start_time", { ascending: true });
    expect(participantsQuery.in).toHaveBeenCalledWith("match_id", ["past-match", "future-match"]);
  });
});
