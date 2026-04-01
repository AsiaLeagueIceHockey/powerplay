import { getMatches } from "@/app/actions/match";
import { getCachedRinks, getCachedClubs } from "@/app/actions/cache";
import type { Match, MatchRink, MatchClub } from "@/app/actions/match";

export async function getMatchesByDate(dateStr: string): Promise<Match[]> {
  try {
    // 1. KST 기준으로 시작/종료 시간 범위 설정
    const targetDate = new Date(dateStr + "T00:00:00+09:00");
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const startIso = targetDate.toISOString();
    const endIso = nextDate.toISOString();

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
