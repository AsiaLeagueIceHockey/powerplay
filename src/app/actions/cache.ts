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
      club_memberships(count)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }

  // Transform to include member_count
  return (clubs || []).map((club) => ({
    ...club,
    member_count: club.club_memberships?.[0]?.count || 0,
    club_memberships: undefined, // Remove nested data
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

  // Calculate today 00:00 in KST, then convert to UTC for DB query
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // KST is UTC+9
  const nowKST = new Date(now.getTime() + kstOffset);
  const todayMidnightKST = new Date(
    Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), nowKST.getUTCDate())
  );
  // Convert back to UTC for database comparison
  const todayMidnightUTC = new Date(todayMidnightKST.getTime() - kstOffset);

  // Fetch matches - only those starting from today (KST) onwards
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
    .gte("start_time", todayMidnightUTC.toISOString())
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
