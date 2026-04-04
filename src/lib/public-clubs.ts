import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { Club, ClubPost } from "@/app/actions/types";
import { applyClubVoteRanking, type ClubVoteTotalRow } from "@/lib/club-voting";

type ClubMemberCountRow = {
  club_id: string;
  member_count: number | string | null;
};

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function mapClubWithRinks(club: Record<string, unknown> & { club_rinks?: Array<{ rink?: unknown }> }) {
  const rinks = club.club_rinks?.map((clubRink) => clubRink.rink).filter(Boolean) || [];

  return {
    ...club,
    rinks,
  } as Club;
}

export const getPublicClubIds = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("clubs")
      .select("id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public club ids:", error);
      return [];
    }

    return (data || []).map((club) => club.id);
  },
  ["public-club-ids"],
  { revalidate: 3600, tags: ["clubs"] }
);

export const getPublicClubs = unstable_cache(
  async (): Promise<Club[]> => {
    const supabase = createPublicSupabaseClient();
    const [{ data: clubs, error }, { data: voteTotals, error: voteError }, { data: memberCounts, error: memberCountsError }] = await Promise.all([
      supabase
        .from("clubs")
        .select("*, club_rinks(rink:rinks(*))")
        .order("name", { ascending: true }),
      supabase.rpc("get_public_club_vote_totals"),
      supabase.rpc("get_public_club_member_counts"),
    ]);

    if (error) {
      console.error("Error fetching public clubs:", error);
      return [];
    }

    if (voteError) {
      console.error("Error fetching public club vote totals:", voteError);
    }

    if (memberCountsError) {
      console.error("Error fetching public club member counts:", memberCountsError);
    }

    const memberCountMap = new Map(
      ((memberCounts || []) as ClubMemberCountRow[]).map((row) => [row.club_id, Number(row.member_count ?? 0)])
    );

    const clubsWithCounts = (clubs || []).map((club) => ({
      ...mapClubWithRinks(club),
      member_count: memberCountMap.get(club.id) ?? 0,
    })) as Club[];

    return applyClubVoteRanking(clubsWithCounts, (voteTotals || []) as ClubVoteTotalRow[]);
  },
  ["public-clubs"],
  { revalidate: 1800, tags: ["clubs"] }
);

export const getPublicClubById = unstable_cache(
  async (id: string): Promise<Club | null> => {
    const supabase = createPublicSupabaseClient();
    const [{ data: club, error }, { data: clubs }, { data: voteTotals, error: voteError }, { data: memberCounts, error: memberCountsError }] = await Promise.all([
      supabase
        .from("clubs")
        .select("*, club_rinks(rink:rinks(*))")
        .eq("id", id)
        .single(),
      supabase
        .from("clubs")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase.rpc("get_public_club_vote_totals"),
      supabase.rpc("get_public_club_member_counts"),
    ]);

    if (error) {
      console.error("Error fetching public club:", error);
      return null;
    }

    if (voteError) {
      console.error("Error fetching public club vote totals:", voteError);
    }

    if (memberCountsError) {
      console.error("Error fetching public club member counts:", memberCountsError);
    }

    const rankedClubs = applyClubVoteRanking((clubs || []) as Club[], (voteTotals || []) as ClubVoteTotalRow[]);
    const rankingTarget = rankedClubs.find((rankedClub) => rankedClub.id === id);
    const memberCountMap = new Map(
      ((memberCounts || []) as ClubMemberCountRow[]).map((row) => [row.club_id, Number(row.member_count ?? 0)])
    );

    return {
      ...mapClubWithRinks(club),
      member_count: memberCountMap.get(id) ?? 0,
      monthly_vote_count: rankingTarget?.monthly_vote_count ?? 0,
      monthly_rank: rankingTarget?.monthly_rank,
      monthly_rank_tied: rankingTarget?.monthly_rank_tied ?? false,
    } as Club;
  },
  ["public-club-by-id"],
  { revalidate: 900, tags: ["clubs"] }
);

export const getPublicClubNotices = unstable_cache(
  async (clubId: string): Promise<ClubPost[]> => {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("club_posts")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public club notices:", error);
      return [];
    }

    return (data || []) as ClubPost[];
  },
  ["public-club-notices"],
  { revalidate: 900, tags: ["clubs"] }
);
