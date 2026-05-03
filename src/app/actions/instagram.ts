import { getMatches } from "@/app/actions/match";
import type { Match } from "@/app/actions/match";

export async function getMatchesByDate(dateStr: string): Promise<Match[]> {
  try {
    // 1. KST 기준으로 시작/종료 시간 범위 설정
    const targetDate = new Date(dateStr + "T00:00:00+09:00");
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // 2. 모든 경기 가져오기 (이미 getMatches 내에서 participants_count 등 조합됨)
    // NOTE: 현재 cache.ts 대신 match.ts의 getMatches를 사용하여 안정적으로 가져옴
    const allMatches = await getMatches();

    // 3. 날짜 범위에 맞는 경기 필터링 및 시간순 정렬
    const filteredMatches = allMatches.filter((match) => {
      const matchTime = new Date(match.start_time);
      return matchTime >= targetDate && matchTime < nextDate && match.status !== "canceled";
    });

    return filteredMatches;
  } catch (error) {
    console.error("Error fetching matches by date:", error);
    return [];
  }
}

/**
 * 주어진 주(weekStart=월요일 KST) 기준 7일치 매치를 시간 오름차순으로 반환.
 *
 * @param weekStartStr - "YYYY-MM-DD" 형태의 KST 월요일 날짜
 * @returns 해당 주 월~일 7일 범위의 canceled 제외 매치 배열
 */
export async function getMatchesByWeek(weekStartStr: string): Promise<Match[]> {
  try {
    // 1. KST 기준으로 주의 시작(월 00:00)과 종료(다음 월 00:00) 범위 설정
    const weekStart = new Date(weekStartStr + "T00:00:00+09:00");
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // 2. 모든 경기 가져오기
    const allMatches = await getMatches();

    // 3. 7일 범위에 맞는 경기 필터링 (canceled 제외) + 시작 시간 오름차순 정렬
    const filteredMatches = allMatches
      .filter((match) => {
        const matchTime = new Date(match.start_time);
        return (
          matchTime >= weekStart &&
          matchTime < weekEnd &&
          match.status !== "canceled"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

    return filteredMatches;
  } catch (error) {
    console.error("Error fetching matches by week:", error);
    return [];
  }
}
