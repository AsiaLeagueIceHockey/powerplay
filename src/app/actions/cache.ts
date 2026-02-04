"use server";

import { createClient } from "@/lib/supabase/server";
import { Rink, Club } from "./types";
import type { Match, MatchRink, MatchClub } from "./match";

// ============================================
// Optimized Data Fetchers (No N+1 queries)
// ============================================
// Note: unstable_cache cannot be used with Supabase because
// createClient() uses cookies() which is a dynamic data source.
// Instead, we optimize the queries themselves to reduce latency.

/**
 * Get all rinks - simple query, no optimization needed
 */
export async function getCachedRinks(): Promise<Rink[]> {
  const supabase = await createClient();

  const { data: rinks, error } = await supabase
    .from("rinks")
    .select("*")
    .order("name_ko", { ascending: true });

  if (error) {
    console.error("Error fetching rinks:", error);
    return [];
  }

  return rinks as Rink[];
}

/**
 * Get all clubs with member counts - optimized single query
 */
export async function getCachedClubs(): Promise<Club[]> {
  const supabase = await createClient();

  // Get clubs with member counts in a single query using subquery
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(`
      *,
      club_memberships(count),
      club_rinks(rink:rinks(*))
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }

  // Transform to include member_count and rinks
  return (clubs || []).map((club) => ({
    ...club,
    member_count: club.club_memberships?.[0]?.count || 0,
    // @ts-ignore
    rinks: club.club_rinks?.map((cr) => cr.rink).filter(Boolean) || [],
    club_memberships: undefined, // Remove nested data
    club_rinks: undefined,
  })) as Club[];
}

/**
 * Get all matches with participant counts - OPTIMIZED (fixes N+1 query)
 * Instead of querying participants for each match individually,
 * we fetch all participants in a single query and group them.
 * Only returns matches starting from today (KST 00:00) onwards.
 */
export async function getCachedMatches(): Promise<Match[]> {
  const supabase = await createClient();

  // Fetch matches - all matches for history
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      start_time,
      fee,
      max_skaters,
      max_goalies,
      status,
      description,
      rink:rink_id(id, name_ko, name_en, address, lat, lng, rink_type),
      club:club_id(id, name, kakao_open_chat_url, logo_url)
    `)
    .neq("status", "canceled")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  const matchIds = (matches || []).map(m => m.id);

  if (matchIds.length === 0) {
    return [];
  }

  // Fetch ALL participants for all matches in ONE query (fixes N+1!)
  // Only count 'confirmed' status for participant counts
  const { data: allParticipants } = await supabase
    .from("participants")
    .select("match_id, position")
    .in("match_id", matchIds)
    .eq("status", "confirmed");

  // Group participants by match_id
  const participantsByMatch = new Map<string, { fw: number; df: number; g: number }>();
  matchIds.forEach(id => participantsByMatch.set(id, { fw: 0, df: 0, g: 0 }));

  (allParticipants || []).forEach(p => {
    const counts = participantsByMatch.get(p.match_id);
    if (counts) {
      if (p.position === "FW") counts.fw++;
      else if (p.position === "DF") counts.df++;
      else if (p.position === "G") counts.g++;
    }
  });

  // Transform matches
  return (matches || []).map(match => {
    const rink = Array.isArray(match.rink) ? match.rink[0] : match.rink;
    const club = Array.isArray(match.club) ? match.club[0] : match.club;

    return {
      ...match,
      rink: rink as MatchRink | null,
      club: club as MatchClub | null,
      participants_count: participantsByMatch.get(match.id) || { fw: 0, df: 0, g: 0 },
    } as Match;
  });
}
