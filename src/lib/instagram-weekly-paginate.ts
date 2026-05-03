import type { Match } from "@/app/actions/match";

/**
 * 주간 인스타 캐러셀 페이지 분할 유틸.
 *
 * - 컨테이너 1080×1920 9:16 스토리. 본문 픽셀 예산 = 1140px.
 * - 사전 픽셀 예산 그리디 분할로 짤림 방지.
 * - 한 날짜 그룹이 페이지 경계를 넘어도 다음 페이지에서 같은 day-header를 다시 표시.
 * - 7일 모두 매치 0개면 빈 배열을 반환 (capture 측에서 "이번 주 일정 없음" 알림 처리).
 */

// ───── 픽셀 예산 ─────
// §5.1 픽셀 예산표 기준. 본문 영역 1140px 안에 day-header / 카드 / 빈 placeholder / 분기선 누적.
const BODY_BUDGET_PX = 1140;
const DAY_HEADER_PX = 60;
const CARD_PX = 150; // 카드 단일 max-h. min-h(130)이 아닌 max로 잡아 안전 측정.
const CARD_GAP_PX = 16; // 같은 그룹 내 카드 사이 gap
const EMPTY_PLACEHOLDER_PX = 50; // 빈 날 placeholder 1줄
const DIVIDER_PX = 49; // 24(top margin) + 1(line) + 24(bottom margin)

export type WeeklyPageDay = {
  /** YYYY-MM-DD KST 기준 날짜 */
  date: string;
  /** 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토 */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** 해당 페이지에 표시될 매치들 (한 날이 여러 페이지에 걸쳐 분할될 수 있음) */
  matches: Match[];
  /** 그룹 내 매치가 0개인 경우 true (placeholder 표시) */
  isEmpty: boolean;
};

export type WeeklyPage = {
  /** 1부터 시작 */
  pageNum: number;
  /** 이 페이지에 들어가는 day 그룹들 */
  days: WeeklyPageDay[];
};

/** 주어진 YYYY-MM-DD 문자열의 KST 기준 weekday(0=일~6=토) 반환. */
function getKstWeekday(dateStr: string): WeeklyPageDay["weekday"] {
  const d = new Date(dateStr + "T00:00:00+09:00");
  // toLocaleDateString 의 weekday 대신 UTC 시간 기준으로 7일 휠을 계산.
  // dateStr 가 KST 자정 → ISO UTC 는 전날 15:00. 따라서 KST 기준 weekday 를 얻으려면
  // KST 기준 시각 그대로 Date.getUTCDay 사용.
  const kstTime = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const wd = kstTime.getUTCDay();
  return wd as WeeklyPageDay["weekday"];
}

/** weekStart(월요일) 기준 7일치 날짜 문자열 배열 반환. */
function buildWeekDates(weekStartStr: string): string[] {
  const start = new Date(weekStartStr + "T00:00:00+09:00");
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    // KST 자정 기준으로 YYYY-MM-DD 추출
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    out.push(kst.toISOString().slice(0, 10));
  }
  return out;
}

/** 매치를 KST 날짜(YYYY-MM-DD)별로 그룹핑. */
function groupMatchesByKstDate(matches: Match[]): Map<string, Match[]> {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const kst = new Date(new Date(m.start_time).getTime() + 9 * 60 * 60 * 1000);
    const key = kst.toISOString().slice(0, 10);
    const list = map.get(key);
    if (list) list.push(m);
    else map.set(key, [m]);
  }
  // 각 날의 매치는 시작 시간 오름차순 정렬
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }
  return map;
}

/**
 * 한 페이지의 잔여 예산 안에서 dayCards 를 최대한 채워 넣고, 넘치면 다음 페이지로 이월할 카드 배열 반환.
 *
 * @returns 현재 페이지에 들어간 카드 수
 */
function fitCardsInBudget(
  remaining: number,
  cardCount: number
): { fit: number; usedPx: number } {
  if (cardCount === 0) {
    // 빈 placeholder 1줄
    if (remaining >= EMPTY_PLACEHOLDER_PX) {
      return { fit: 0, usedPx: EMPTY_PLACEHOLDER_PX };
    }
    return { fit: -1, usedPx: 0 }; // placeholder 도 안 들어감
  }
  let used = 0;
  let fit = 0;
  for (let i = 0; i < cardCount; i++) {
    const inc = i === 0 ? CARD_PX : CARD_PX + CARD_GAP_PX;
    if (used + inc > remaining) break;
    used += inc;
    fit++;
  }
  return { fit, usedPx: used };
}

/**
 * 7일치 매치를 픽셀 예산 그리디 분할로 페이지 단위로 묶는다.
 *
 * @param matches - 해당 주의 매치 배열 (이미 시간 오름차순)
 * @param weekStartStr - 주 시작일 YYYY-MM-DD (월요일 KST)
 * @returns 페이지 배열. 7일 모두 매치 0개면 빈 배열 반환.
 */
export function paginateWeeklyMatches(
  matches: Match[],
  weekStartStr: string
): WeeklyPage[] {
  const weekDates = buildWeekDates(weekStartStr);
  const grouped = groupMatchesByKstDate(matches);

  // 7일 모두 0매치면 빈 배열 — capture 측이 "이번 주 일정 없음"으로 처리
  const totalMatches = matches.length;
  if (totalMatches === 0) return [];

  const pages: WeeklyPage[] = [];
  let curPage: WeeklyPage = { pageNum: 1, days: [] };
  let curUsed = 0;
  let isFirstDayOfPage = true;

  const flushNewPage = () => {
    pages.push(curPage);
    curPage = { pageNum: curPage.pageNum + 1, days: [] };
    curUsed = 0;
    isFirstDayOfPage = true;
  };

  for (const dateStr of weekDates) {
    const dayMatches = grouped.get(dateStr) ?? [];
    let cursor = 0; // dayMatches 안에서 아직 페이지에 못 넣은 시작 인덱스

    while (true) {
      // divider + day-header 가 들어가야 함. divider 는 페이지 첫 그룹이 아닐 때만.
      const dividerCost = isFirstDayOfPage ? 0 : DIVIDER_PX;
      const headerCost = DAY_HEADER_PX;
      const fixedCost = dividerCost + headerCost;
      const remainingForBody = BODY_BUDGET_PX - curUsed - fixedCost;

      // header 자체가 안 들어가면 새 페이지로
      if (remainingForBody < 0) {
        flushNewPage();
        continue;
      }

      const remainingCards = dayMatches.length - cursor;
      const { fit, usedPx } = fitCardsInBudget(remainingForBody, remainingCards);

      if (remainingCards === 0) {
        // 빈 날 placeholder 처리
        if (fit === -1) {
          // placeholder 도 안 들어감 → 새 페이지로
          flushNewPage();
          continue;
        }
        // placeholder 들어감
        curPage.days.push({
          date: dateStr,
          weekday: getKstWeekday(dateStr),
          matches: [],
          isEmpty: true,
        });
        curUsed += fixedCost + usedPx;
        isFirstDayOfPage = false;
        break; // 다음 날짜로
      }

      if (fit === 0) {
        // 카드가 1개도 안 들어감 → 새 페이지
        flushNewPage();
        continue;
      }

      // fit 개의 카드를 현재 페이지에 추가
      const slice = dayMatches.slice(cursor, cursor + fit);
      curPage.days.push({
        date: dateStr,
        weekday: getKstWeekday(dateStr),
        matches: slice,
        isEmpty: false,
      });
      curUsed += fixedCost + usedPx;
      isFirstDayOfPage = false;
      cursor += fit;

      if (cursor >= dayMatches.length) {
        break; // 이 날 모두 처리됨, 다음 날짜로
      }
      // 남은 카드가 있으면 새 페이지에서 같은 day-header 로 이어서 (이어서 표기 X — §5.1)
      flushNewPage();
    }
  }

  // 마지막 페이지 push
  if (curPage.days.length > 0) {
    pages.push(curPage);
  }

  return pages;
}

/** 캡처 스크립트가 페이지 수를 미리 알기 위한 헬퍼. */
export function countWeeklyPages(matches: Match[], weekStartStr: string): number {
  return paginateWeeklyMatches(matches, weekStartStr).length;
}
