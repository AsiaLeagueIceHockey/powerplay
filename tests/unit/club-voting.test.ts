import { describe, expect, it } from "vitest";

import { applyClubVoteRanking, getKstDateKey, getKstMonthKey } from "@/lib/club-voting";

describe("club-voting", () => {
  it("converts UTC timestamps into KST date and month keys", () => {
    expect(getKstDateKey("2026-04-01T00:30:00.000Z")).toBe("2026-04-01");
    expect(getKstMonthKey("2026-03-31T15:30:00.000Z")).toBe("2026-04");
  });

  it("sorts clubs by monthly votes and falls back to alphabetical order for ties", () => {
    const ranked = applyClubVoteRanking(
      [
        { id: "b", name: "Bravo" },
        { id: "a", name: "Alpha" },
        { id: "g", name: "가나다" },
      ],
      [
        { club_id: "g", vote_count: 5 },
        { club_id: "a", vote_count: 5 },
        { club_id: "b", vote_count: 2 },
      ]
    );

    expect(ranked.map((club) => `${club.monthly_rank}:${club.name}:${club.monthly_vote_count}`)).toEqual([
      "1:Alpha:5",
      "1:가나다:5",
      "3:Bravo:2",
    ]);
  });
});
