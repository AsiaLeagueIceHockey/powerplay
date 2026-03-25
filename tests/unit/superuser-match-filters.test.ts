import { describe, expect, it, vi } from "vitest";
import {
  filterSuperuserMatches,
  getSuperuserMatchDisplayStatus,
} from "@/lib/superuser-match-filters";
import type { SuperuserMatchSummary } from "@/app/actions/superuser";

const MATCHES: SuperuserMatchSummary[] = [
  {
    id: "m1",
    start_time: "2026-03-10T10:00:00.000Z",
    fee: 30000,
    entry_points: 30000,
    max_skaters: 20,
    max_goalies: 2,
    status: "open",
    description: "강남 새벽 훈련",
    rink: { name_ko: "목동링크", name_en: "Mokdong" },
    club: { name: "파워플레이" },
    match_type: "training",
    bank_account: "카카오뱅크 3333-01-2345678 홍길동",
    creator: { full_name: "조윤정", email: "coach@powerplay.kr" },
    participants_count: { fw: 4, df: 3, g: 1 },
    total_participants: 8,
  },
  {
    id: "m2",
    start_time: "2026-03-25T10:00:00.000Z",
    fee: 35000,
    entry_points: 35000,
    max_skaters: 20,
    max_goalies: 2,
    status: "closed",
    description: "주말 게임",
    rink: { name_ko: "고양링크", name_en: "Goyang" },
    club: { name: "위너스" },
    match_type: "game",
    bank_account: null,
    creator: { full_name: "김관리", email: "admin@example.com" },
    participants_count: { fw: 8, df: 6, g: 2 },
    total_participants: 16,
  },
  {
    id: "m3",
    start_time: "2026-03-28T10:00:00.000Z",
    fee: 0,
    entry_points: 0,
    max_skaters: 1,
    max_goalies: 0,
    status: "canceled",
    description: "팀 매치",
    rink: { name_ko: "의정부링크", name_en: "Uijeongbu" },
    club: null,
    match_type: "team_match",
    bank_account: null,
    creator: { full_name: null, email: "team@example.com" },
    participants_count: { fw: 0, df: 0, g: 0 },
    total_participants: 1,
  },
];

describe("superuser-match-filters", () => {
  it("searches across rink, creator, club, description, and bank account", () => {
    expect(
      filterSuperuserMatches(MATCHES, {
        query: "목동",
        status: "all",
        type: "all",
      }).map((match) => match.id)
    ).toEqual(["m1"]);

    expect(
      filterSuperuserMatches(MATCHES, {
        query: "조윤정",
        status: "all",
        type: "all",
      }).map((match) => match.id)
    ).toEqual(["m1"]);

    expect(
      filterSuperuserMatches(MATCHES, {
        query: "3333-01-2345678",
        status: "all",
        type: "all",
      }).map((match) => match.id)
    ).toEqual(["m1"]);
  });

  it("filters by status and type", () => {
    expect(
      filterSuperuserMatches(MATCHES, {
        query: "",
        status: "closed",
        type: "game",
      }).map((match) => match.id)
    ).toEqual(["m2"]);
  });

  it("treats past matches as finished for filtering", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T00:00:00.000Z"));

    expect(getSuperuserMatchDisplayStatus(MATCHES[0].start_time, MATCHES[0].status)).toBe("finished");

    expect(
      filterSuperuserMatches(MATCHES, {
        query: "",
        status: "finished",
        type: "all",
      }).map((match) => match.id)
    ).toEqual(["m1"]);

    vi.useRealTimers();
  });
});
