import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { Club } from "@/app/actions/types";
import {
  applyClubVoteRanking,
  getKstMonthKey,
  type ClubVoteTotalRow,
} from "@/lib/club-voting";

type ClubMemberCountRow = {
  club_id: string;
  member_count: number | string | null;
};

type ClubRinkJoinRow = {
  rink?: unknown;
};

type ClubRowFromSupabase = Record<string, unknown> & {
  club_rinks?: ClubRinkJoinRow[];
};

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface ClubRankingResult {
  rankedClubs: Club[];
  monthLabel: string;
  monthKst: string;
}

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function mapClubWithRinks(club: ClubRowFromSupabase): Club {
  const rinks = (club.club_rinks ?? [])
    .map((clubRink) => clubRink.rink)
    .filter((rink): rink is NonNullable<typeof rink> => Boolean(rink));

  return {
    ...club,
    rinks,
  } as unknown as Club;
}

function normalizeMonthKey(monthKst: string): string {
  if (MONTH_KEY_REGEX.test(monthKst)) {
    return monthKst;
  }
  return getKstMonthKey(new Date());
}

function buildMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) {
    return monthKey;
  }
  return `${year}년 ${month}월`;
}

async function fetchClubRanking(monthKey: string): Promise<Club[]> {
  const supabase = createPublicSupabaseClient();

  const [
    { data: clubs, error: clubsError },
    { data: voteTotals, error: voteError },
    { data: memberCounts, error: memberCountsError },
  ] = await Promise.all([
    supabase
      .from("clubs")
      .select("*, club_rinks(rink:rinks(*))"),
    supabase.rpc("get_public_club_vote_totals", {
      target_month_kst: monthKey,
    }),
    supabase.rpc("get_public_club_member_counts"),
  ]);

  if (clubsError) {
    console.error("Error fetching clubs for ranking capture:", clubsError);
    return [];
  }

  if (voteError) {
    console.error(
      "Error fetching vote totals for ranking capture:",
      voteError
    );
  }

  if (memberCountsError) {
    console.error(
      "Error fetching member counts for ranking capture:",
      memberCountsError
    );
  }

  const memberCountMap = new Map(
    ((memberCounts ?? []) as ClubMemberCountRow[]).map((row) => [
      row.club_id,
      Number(row.member_count ?? 0),
    ])
  );

  const clubsWithCounts: Club[] = (
    (clubs ?? []) as ClubRowFromSupabase[]
  ).map((club) => {
    const mapped = mapClubWithRinks(club);
    const id = (club as { id?: string }).id ?? "";
    return {
      ...mapped,
      member_count: memberCountMap.get(id) ?? 0,
    };
  });

  return applyClubVoteRanking(
    clubsWithCounts,
    (voteTotals ?? []) as ClubVoteTotalRow[]
  );
}

const cachedFetchClubRanking = unstable_cache(
  async (monthKey: string) => fetchClubRanking(monthKey),
  ["instagram-club-ranking"],
  { revalidate: 600, tags: ["clubs", "club-votes"] }
);

/**
 * Returns the top monthly cheer ranking (rank <= 5, clamped to 5 entries) for
 * the given KST month. Used by the Instagram story capture page only.
 *
 * - `monthKst` must be `YYYY-MM`. Invalid values silently fall back to the
 *   current KST month (per orchestrator decision).
 * - Note: `clubs.deleted_at` does NOT exist in the schema — do not add a
 *   `deleted_at` filter here.
 */
export async function getClubRankingForMonth(
  monthKst: string
): Promise<ClubRankingResult> {
  const monthKey = normalizeMonthKey(monthKst);
  const allRanked = await cachedFetchClubRanking(monthKey);

  const top = allRanked
    .filter((club) => (club.monthly_rank ?? Number.POSITIVE_INFINITY) <= 5)
    .slice(0, 5);

  return {
    rankedClubs: top,
    monthLabel: buildMonthLabel(monthKey),
    monthKst: monthKey,
  };
}
