"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Rink, Club } from "./types";
import type { Match, MatchRink, MatchClub } from "./match";

// ============================================
// Cached Data Fetchers
// ============================================

/**
 * Get all rinks with 5-minute cache
 * Rinks data rarely changes, so longer cache is fine
 */
export const getCachedRinks = unstable_cache(
  async (): Promise<Rink[]> => {
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
  },
  ["rinks"],
  { revalidate: 300, tags: ["rinks"] } // 5 minutes
);

/**
 * Get all clubs with member counts - 30 second cache
 */
export const getCachedClubs = unstable_cache(
  async (): Promise<Club[]> => {
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
  },
  ["clubs"],
  { revalidate: 30, tags: ["clubs"] } // 30 seconds
);

/**
 * Get all matches with participant counts - 15 second cache
 * Matches change more frequently, so shorter cache
 */
export const getCachedMatches = unstable_cache(
  async (): Promise<Match[]> => {
    const supabase = await createClient();

    // Fetch matches
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
    const { data: allParticipants } = await supabase
      .from("participants")
      .select("match_id, position")
      .in("match_id", matchIds)
      .in("status", ["applied", "confirmed"]);

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
  },
  ["matches"],
  { revalidate: 15, tags: ["matches"] } // 15 seconds
);
