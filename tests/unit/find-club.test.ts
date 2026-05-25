import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSupabase, resetSupabaseMock, createChainableMock } from "../mocks/supabase";
import { getClubRecommendations } from "@/app/actions/find-club";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@/lib/audit", () => ({
  logAndNotify: vi.fn(() => Promise.resolve()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("find-club recommendations", () => {
  let clubsMock: any;
  let matchesMock: any;
  let loungeMock: any;

  beforeEach(() => {
    resetSupabaseMock();
    clubsMock = createChainableMock();
    matchesMock = createChainableMock();
    loungeMock = createChainableMock();

    // Add missing chain methods to matchesMock
    matchesMock.neq = vi.fn().mockReturnThis();
    matchesMock.gte = vi.fn();

    mockSupabase.from.mockImplementation((table: string) => {
      switch (table) {
        case "clubs": return clubsMock;
        case "matches": return matchesMock;
        case "lounge_businesses": return loungeMock;
        default: return createChainableMock();
      }
    });

    (mockSupabase as any).rpc = vi.fn().mockImplementation((fn: string) => {
      if (fn === "get_public_club_member_counts") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    }) as any;

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("filters out clubs whose name contains '파워플레이'", async () => {
    // 1. Setup mock data
    // Two clubs: one normal, one test club with '파워플레이'
    clubsMock.order.mockResolvedValue({
      data: [
        {
          id: "club-1",
          name: "안양 타이거즈",
          description: "안양 지역 하키 클럽",
          club_rinks: [
            {
              rink: {
                id: "rink-1",
                name_ko: "안양아이스링크",
                address: "경기 안양시 동안구 평촌대로",
              },
            },
          ],
        },
        {
          id: "club-test",
          name: "파워플레이 테스트",
          description: "내부 테스트용 클럽",
          club_rinks: [
            {
              rink: {
                id: "rink-1",
                name_ko: "안양아이스링크",
                address: "경기 안양시 동안구 평촌대로",
              },
            },
          ],
        },
      ],
    });

    matchesMock.gte.mockResolvedValue({ data: [] });

    // 2. Action
    const result = await getClubRecommendations({
      playerType: "adult",
      regions: ["경기 안양시"],
      hasEquipment: true,
    });

    // 3. Verify
    // The "파워플레이 테스트" club should be excluded
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].id).toBe("club-1");
    expect(result.recommendations[0].name).toBe("안양 타이거즈");
    expect(result.totalClubCount).toBe(1); // Since clubs are filtered before counting in totalClubCount
  });

  it("filters out lounge businesses whose name contains '파워플레이'", async () => {
    // For youth club businesses
    clubsMock.order.mockResolvedValue({ data: [] });
    matchesMock.gte.mockResolvedValue({ data: [] });

    const mockLoungeData = [
      {
        id: "biz-1",
        slug: "biz-normal",
        name: "스타 하키 아카데미",
        category: "youth_club",
        address: "경기 안양시 동안구 평촌대로",
        is_published: true,
      },
      {
        id: "biz-test",
        slug: "biz-test-slug",
        name: "파워플레이 유소년 하키",
        category: "youth_club",
        address: "경기 안양시 동안구 평촌대로",
        is_published: true,
      },
    ];

    // Handle multiple eq calls by returning this for first, and resolving data for the second (category check)
    loungeMock.eq.mockImplementation(function (key: string, value: any) {
      if (key === "category") {
        return Promise.resolve({ data: mockLoungeData });
      }
      return loungeMock;
    });

    const result = await getClubRecommendations({
      playerType: "youth",
      regions: ["경기 안양시"],
      hasEquipment: true,
    });

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].id).toBe("biz-1");
    expect(result.recommendations[0].name).toBe("스타 하키 아카데미");
  });
});
