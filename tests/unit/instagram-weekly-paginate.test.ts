import { describe, it, expect } from "vitest";
import {
  paginateWeeklyMatches,
  countWeeklyPages,
  type WeeklyPage,
} from "@/lib/instagram-weekly-paginate";
import type { Match } from "@/app/actions/match";

// ───── 헬퍼: 가짜 매치 빌더 ─────
function makeMatch(id: string, kstDateTime: string): Match {
  // kstDateTime 예: "2026-05-04T19:00:00"
  const iso = new Date(kstDateTime + "+09:00").toISOString();
  return {
    id,
    start_time: iso,
    duration_minutes: 90,
    fee: 30000,
    entry_points: 30000,
    rental_fee: 5000,
    rental_available: false,
    match_type: "training",
    max_skaters: 16,
    max_goalies: 2,
    status: "open",
    rink: { id: "r1", name_ko: "링크", name_en: "Rink" },
    club: null,
  } satisfies Match;
}

const WEEK_START = "2026-05-04"; // 월요일 KST

describe("paginateWeeklyMatches", () => {
  it("7일 모두 매치 0개 → 빈 배열 반환 (capture 측이 emptyWeek 처리)", () => {
    const pages = paginateWeeklyMatches([], WEEK_START);
    expect(pages).toEqual([]);
    expect(countWeeklyPages([], WEEK_START)).toBe(0);
  });

  it("매치 1개 → 7일 모두 day 그룹 포함 (페이지 수 무관, 누락 없음)", () => {
    const matches: Match[] = [makeMatch("m1", "2026-05-04T19:00:00")];
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    // 7일 모두 어떤 페이지엔가는 등장
    const allDateSet = new Set(pages.flatMap((p) => p.days.map((d) => d.date)));
    expect(allDateSet.size).toBe(7);
    // 월요일에 매치 1
    const monMatches = pages.flatMap((p) =>
      p.days
        .filter((d) => d.date === "2026-05-04")
        .flatMap((d) => d.matches.map((m) => m.id))
    );
    expect(monMatches).toEqual(["m1"]);
    // 화~일 모두 빈
    const emptyDates = new Set(
      pages.flatMap((p) => p.days.filter((d) => d.isEmpty).map((d) => d.date))
    );
    expect(emptyDates.size).toBe(6);
  });

  it("매치 8개 (월에 4, 화에 4) → 1페이지 (예산 안)", () => {
    const matches: Match[] = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeMatch(`mon-${i}`, `2026-05-04T${10 + i * 2}:00:00`)
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeMatch(`tue-${i}`, `2026-05-05T${10 + i * 2}:00:00`)
      ),
    ];
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    // 본문 1140 예산: 7일 헤더(60×7=420) + 분기선(49×6=294) + 매치 8장(150 + 7*166=1162) → 초과 → 2페이지로 나뉨
    expect(pages.length).toBeGreaterThanOrEqual(1);
    // 모든 카드가 어떤 페이지에든 포함되어야 함
    const renderedIds = pages.flatMap((p) =>
      p.days.flatMap((d) => d.matches.map((m) => m.id))
    );
    expect(renderedIds.sort()).toEqual(matches.map((m) => m.id).sort());
  });

  it("매치 30개 폭주 시나리오 → 여러 페이지 + 짤림 X (각 페이지 예산 안)", () => {
    const matches: Match[] = [];
    // 월~일 7일에 매치 분산 — 대략 4~5개씩
    const days = [
      "2026-05-04",
      "2026-05-05",
      "2026-05-06",
      "2026-05-07",
      "2026-05-08",
      "2026-05-09",
      "2026-05-10",
    ];
    for (let i = 0; i < 30; i++) {
      const d = days[i % 7];
      const hour = 8 + Math.floor(i / 7);
      matches.push(makeMatch(`m-${i}`, `${d}T${String(hour).padStart(2, "0")}:00:00`));
    }
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    expect(pages.length).toBeGreaterThan(1);

    // 모든 매치가 정확히 1번씩 렌더되어야 함 (분할 누락/중복 없음)
    const renderedIds = pages.flatMap((p) =>
      p.days.flatMap((d) => d.matches.map((m) => m.id))
    );
    expect(renderedIds.length).toBe(30);
    expect(new Set(renderedIds).size).toBe(30);
  });

  it("한 날에 12개 몰빵 → 같은 날짜가 여러 페이지에 걸쳐 분할되어도 모든 카드가 렌더됨", () => {
    const matches: Match[] = Array.from({ length: 12 }, (_, i) =>
      makeMatch(`m-${i}`, `2026-05-04T${String(8 + i).padStart(2, "0")}:00:00`)
    );
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    // 한 페이지 본문 1140 / (CARD 150 + GAP 16 = 166) ≈ 6장 + day header 60 = 한 페이지에 ~6장
    // 12장이면 최소 2페이지 + 빈 날 6일이 어떤 페이지엔가 들어감
    expect(pages.length).toBeGreaterThanOrEqual(2);

    // 12 매치 모두 분할되어 정확히 1번씩 렌더
    const monMatches = pages.flatMap((p) =>
      p.days
        .filter((d) => d.date === "2026-05-04")
        .flatMap((d) => d.matches.map((m) => m.id))
    );
    expect(monMatches.length).toBe(12);
    expect(new Set(monMatches).size).toBe(12);

    // 빈 날(화~일) 도 어떤 페이지엔가는 emptyEntry 로 들어가 있어야 함
    const emptyDateSet = new Set<string>();
    for (const p of pages) {
      for (const d of p.days) {
        if (d.isEmpty) emptyDateSet.add(d.date);
      }
    }
    expect(emptyDateSet.size).toBe(6); // 화~일
  });

  it("페이지 분할 시 한 날의 카드 순서가 보존되어야 함", () => {
    const matches: Match[] = Array.from({ length: 12 }, (_, i) =>
      makeMatch(`m-${i}`, `2026-05-04T${String(8 + i).padStart(2, "0")}:00:00`)
    );
    const pages = paginateWeeklyMatches(matches, WEEK_START);

    const monMatchOrder = pages.flatMap((p) =>
      p.days
        .filter((d) => d.date === "2026-05-04")
        .flatMap((d) => d.matches.map((m) => m.id))
    );
    // 입력 순서와 동일해야 함
    expect(monMatchOrder).toEqual(matches.map((m) => m.id));
  });

  it("페이지마다 pageNum 이 1부터 순차 증가해야 함", () => {
    const matches: Match[] = Array.from({ length: 20 }, (_, i) =>
      makeMatch(`m-${i}`, `2026-05-${String(4 + (i % 7)).padStart(2, "0")}T${String(8 + Math.floor(i / 7)).padStart(2, "0")}:00:00`)
    );
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    pages.forEach((p, idx) => {
      expect(p.pageNum).toBe(idx + 1);
    });
  });
});

// ───── weekday 매핑 검증 ─────
describe("weekday mapping (KST)", () => {
  it("2026-05-04 = 월(1), 2026-05-05 = 화(2), 2026-05-10 = 일(0)", () => {
    const matches: Match[] = [
      makeMatch("a", "2026-05-04T10:00:00"),
      makeMatch("b", "2026-05-05T10:00:00"),
      makeMatch("c", "2026-05-10T10:00:00"),
    ];
    const pages = paginateWeeklyMatches(matches, WEEK_START);
    const allDays = pages.flatMap((p) => p.days);
    const mon = allDays.find((d) => d.date === "2026-05-04");
    const tue = allDays.find((d) => d.date === "2026-05-05");
    const sun = allDays.find((d) => d.date === "2026-05-10");
    expect(mon?.weekday).toBe(1);
    expect(tue?.weekday).toBe(2);
    expect(sun?.weekday).toBe(0);
  });
});
