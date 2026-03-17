import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { Club, ClubPost } from "@/app/actions/types";

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
    const { data: clubs, error } = await supabase
      .from("clubs")
      .select("*, club_rinks(rink:rinks(*))")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching public clubs:", error);
      return [];
    }

    const clubsWithCounts = await Promise.all(
      (clubs || []).map(async (club) => {
        const { count } = await supabase
          .from("club_memberships")
          .select("*", { count: "exact", head: true })
          .eq("club_id", club.id);

        return {
          ...mapClubWithRinks(club),
          member_count: count || 0,
        } as Club;
      })
    );

    return clubsWithCounts;
  },
  ["public-clubs"],
  { revalidate: 1800, tags: ["clubs"] }
);

export const getPublicClubById = unstable_cache(
  async (id: string): Promise<Club | null> => {
    const supabase = createPublicSupabaseClient();
    const { data: club, error } = await supabase
      .from("clubs")
      .select("*, club_rinks(rink:rinks(*))")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching public club:", error);
      return null;
    }

    const { count } = await supabase
      .from("club_memberships")
      .select("*", { count: "exact", head: true })
      .eq("club_id", id);

    return {
      ...mapClubWithRinks(club),
      member_count: count || 0,
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
