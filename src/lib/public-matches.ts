import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { Match, MatchClub, MatchRink } from "@/app/actions/match";

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function fetchPublicMatches(): Promise<Match[]> {
  const supabase = createPublicSupabaseClient();
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`id, start_time, fee, duration_minutes, max_skaters, max_goalies, status, entry_points, rental_fee, rental_available, match_type, max_guests, description, rink:rink_id(id, name_ko, name_en, address, lat, lng, rink_type), club:club_id(id, name, kakao_open_chat_url, logo_url)`)
    .neq("status", "canceled")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error || !matches?.length) return [];
  const ids = matches.map((match) => match.id);
  const { data: participants } = await supabase
    .from("participants")
    .select("match_id, position")
    .in("match_id", ids)
    .eq("status", "confirmed");

  const counts = new Map(ids.map((id) => [id, { fw: 0, df: 0, g: 0 }]));
  for (const participant of participants ?? []) {
    const count = counts.get(participant.match_id);
    if (!count) continue;
    if (participant.position === "FW") count.fw += 1;
    else if (participant.position === "DF") count.df += 1;
    else if (participant.position === "G") count.g += 1;
  }

  return matches.map((match) => ({
    ...match,
    rink: (Array.isArray(match.rink) ? match.rink[0] : match.rink) as MatchRink | null,
    club: (Array.isArray(match.club) ? match.club[0] : match.club) as MatchClub | null,
    participants_count: counts.get(match.id) ?? { fw: 0, df: 0, g: 0 },
  })) as Match[];
}

export const getPublicHomeMatches = unstable_cache(
  fetchPublicMatches,
  ["public-home-matches-v1"],
  { revalidate: 15, tags: ["matches"] }
);
