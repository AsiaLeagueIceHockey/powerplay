import type { Club } from "@/app/actions/types";

export const CLUB_VOTE_DAILY_LIMIT = 3;
export const POWERPLAY_INSTAGRAM_URL = "https://www.instagram.com/powerplay.kr/";

export interface ClubVoteTotalRow {
  club_id: string;
  vote_count: number | string | null;
}

function getDateParts(input: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);
}

export function getKstDateKey(input: string | Date) {
  const parts = getDateParts(input);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export function getKstMonthKey(input: string | Date) {
  return getKstDateKey(input).slice(0, 7);
}

export function getCurrentVoteMonthRangeUtc(now: Date = new Date()) {
  const monthKey = getKstMonthKey(now);
  const [year, month] = monthKey.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const paddedNextMonth = String(nextMonth).padStart(2, "0");

  return {
    monthKey,
    startUtc: new Date(`${monthKey}-01T00:00:00+09:00`).toISOString(),
    endUtc: new Date(`${nextYear}-${paddedNextMonth}-01T00:00:00+09:00`).toISOString(),
  };
}

function compareClubNames(left: string, right: string) {
  const startsWithAsciiLeft = /^[A-Za-z0-9]/.test(left);
  const startsWithAsciiRight = /^[A-Za-z0-9]/.test(right);

  if (startsWithAsciiLeft !== startsWithAsciiRight) {
    return startsWithAsciiLeft ? -1 : 1;
  }

  return left.localeCompare(right, "ko", { sensitivity: "base" });
}

export function applyClubVoteRanking(clubs: Club[], voteTotals: ClubVoteTotalRow[]) {
  const voteMap = new Map(voteTotals.map((row) => [row.club_id, Number(row.vote_count ?? 0)]));

  const rankedClubs = [...clubs]
    .map((club) => ({
      ...club,
      monthly_vote_count: voteMap.get(club.id) ?? 0,
    }))
    .sort((left, right) => {
      const voteDelta = (right.monthly_vote_count ?? 0) - (left.monthly_vote_count ?? 0);
      if (voteDelta !== 0) {
        return voteDelta;
      }

      return compareClubNames(left.name, right.name);
    });

  let previousVoteCount: number | null = null;
  let currentRank = 0;

  return rankedClubs.map((club, index) => {
    const voteCount = club.monthly_vote_count ?? 0;
    const previousVoteCountForTie = index > 0 ? rankedClubs[index - 1]?.monthly_vote_count ?? 0 : null;
    const nextVoteCountForTie =
      index < rankedClubs.length - 1 ? rankedClubs[index + 1]?.monthly_vote_count ?? 0 : null;

    if (previousVoteCount === null || voteCount < previousVoteCount) {
      currentRank = index + 1;
      previousVoteCount = voteCount;
    }

    return {
      ...club,
      monthly_rank: currentRank,
      monthly_rank_tied:
        voteCount > 0 &&
        (previousVoteCountForTie === voteCount || nextVoteCountForTie === voteCount),
    };
  });
}
