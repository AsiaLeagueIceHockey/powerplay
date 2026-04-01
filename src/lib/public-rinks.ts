import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { Club, Rink } from "@/app/actions/types";
import type { Match } from "@/app/actions/match";

type PublicRinkClub = Pick<Club, "id" | "name" | "description" | "logo_url" | "kakao_open_chat_url">;
type PublicRinkMatch = Pick<
  Match,
  "id" | "start_time" | "status" | "match_type" | "entry_points" | "fee" | "description"
> & {
  club: Pick<Club, "id" | "name" | "logo_url"> | null;
};

export interface PublicRink extends Rink {
  updated_at?: string;
  clubs: PublicRinkClub[];
  matches: PublicRinkMatch[];
  club_count: number;
  upcoming_match_count: number;
}

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function fetchPublicRinks(): Promise<PublicRink[]> {
  const supabase = createPublicSupabaseClient();
  const { data: rinks, error } = await supabase
    .from("rinks")
    .select("id, name_ko, name_en, map_url, address, rink_type, lat, lng, updated_at")
    .eq("is_approved", true)
    .order("name_ko", { ascending: true });

  if (error) {
    console.error("Error fetching public rinks:", error);
    return [];
  }

  const rinkList = (rinks || []) as Array<Rink & { updated_at?: string }>;
  if (rinkList.length === 0) {
    return [];
  }

  const rinkIds = rinkList.map((rink) => rink.id);
  const nowIso = new Date().toISOString();

  const [{ data: clubLinks, error: clubError }, { data: matches, error: matchError }] =
    await Promise.all([
      supabase
        .from("club_rinks")
        .select("rink_id, club:club_id(id, name, description, logo_url, kakao_open_chat_url)")
        .in("rink_id", rinkIds),
      supabase
        .from("matches")
        .select(
          "id, rink_id, start_time, status, match_type, entry_points, fee, description, club:club_id(id, name, logo_url)"
        )
        .in("rink_id", rinkIds)
        .eq("status", "open")
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true }),
    ]);

  if (clubError) {
    console.error("Error fetching rink clubs:", clubError);
  }

  if (matchError) {
    console.error("Error fetching rink matches:", matchError);
  }

  const clubsByRink = new Map<string, PublicRinkClub[]>();
  for (const link of clubLinks || []) {
    const club = Array.isArray(link.club) ? link.club[0] : link.club;
    if (!club) continue;

    const existing = clubsByRink.get(link.rink_id) || [];
    existing.push(club as PublicRinkClub);
    clubsByRink.set(link.rink_id, existing);
  }

  const matchesByRink = new Map<string, PublicRinkMatch[]>();
  for (const match of matches || []) {
    const club = Array.isArray(match.club) ? match.club[0] : match.club;
    const existing = matchesByRink.get(match.rink_id) || [];

    existing.push({
      id: match.id,
      start_time: match.start_time,
      status: match.status,
      match_type: match.match_type,
      entry_points: match.entry_points,
      fee: match.fee,
      description: match.description,
      club: (club as PublicRinkMatch["club"]) || null,
    });

    matchesByRink.set(match.rink_id, existing);
  }

  return rinkList.map((rink) => {
    const clubs = clubsByRink.get(rink.id) || [];
    const dedupedClubs = Array.from(new Map(clubs.map((club) => [club.id, club])).values());
    const rinkMatches = matchesByRink.get(rink.id) || [];

    return {
      ...rink,
      clubs: dedupedClubs,
      matches: rinkMatches,
      club_count: dedupedClubs.length,
      upcoming_match_count: rinkMatches.length,
    };
  });
}

export const getPublicRinks = unstable_cache(
  async (): Promise<PublicRink[]> => fetchPublicRinks(),
  ["public-rinks"],
  { revalidate: 1800, tags: ["rinks", "matches", "clubs"] }
);

export const getPublicRinkIds = unstable_cache(
  async (): Promise<string[]> => {
    const rinks = await fetchPublicRinks();
    return rinks.map((rink) => rink.id);
  },
  ["public-rink-ids"],
  { revalidate: 3600, tags: ["rinks"] }
);

export const getPublicRinkById = unstable_cache(
  async (id: string): Promise<PublicRink | null> => {
    const rinks = await fetchPublicRinks();
    return rinks.find((rink) => rink.id === id) || null;
  },
  ["public-rink-by-id"],
  { revalidate: 900, tags: ["rinks", "matches", "clubs"] }
);
