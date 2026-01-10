"use server";

import { createClient } from "@/lib/supabase/server";

// Type definitions for match data
export interface MatchRink {
  id?: string;
  name_ko: string;
  name_en: string;
  map_url?: string;
}

export interface MatchParticipant {
  id: string;
  position: "FW" | "DF" | "G";
  status: "applied" | "confirmed" | "waiting" | "canceled";
  payment_status: boolean;
  team_color: "Black" | "White" | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface Match {
  id: string;
  start_time: string;
  fee: number;
  max_fw: number;
  max_df: number;
  max_g: number;
  status: "open" | "closed" | "canceled";
  description: string | null;
  bank_account?: string | null;
  rink: MatchRink | null;
  participants_count?: {
    fw: number;
    df: number;
    g: number;
  };
  participants?: MatchParticipant[];
}

export async function getMatches(): Promise<Match[]> {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      start_time,
      fee,
      max_fw,
      max_df,
      max_g,
      status,
      description,
      rink:rink_id(name_ko, name_en)
    `
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  // Get participant counts for each match
  const matchesWithCounts = await Promise.all(
    (matches || []).map(async (match) => {
      const { data: participants } = await supabase
        .from("participants")
        .select("position")
        .eq("match_id", match.id)
        .in("status", ["applied", "confirmed"]);

      const counts = {
        fw: participants?.filter((p) => p.position === "FW").length || 0,
        df: participants?.filter((p) => p.position === "DF").length || 0,
        g: participants?.filter((p) => p.position === "G").length || 0,
      };

      // Handle rink which might be an array or object
      const rink = Array.isArray(match.rink) ? match.rink[0] : match.rink;

      return {
        ...match,
        rink: rink as MatchRink | null,
        participants_count: counts,
      } as Match;
    })
  );

  return matchesWithCounts;
}

export async function getMatch(id: string): Promise<Match | null> {
  const supabase = await createClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      start_time,
      fee,
      max_fw,
      max_df,
      max_g,
      status,
      description,
      bank_account,
      rink:rink_id(id, name_ko, name_en, map_url)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching match:", error);
    return null;
  }

  // Get participants
  const { data: participants } = await supabase
    .from("participants")
    .select(
      `
      id,
      position,
      status,
      payment_status,
      team_color,
      user:user_id(id, full_name, email)
    `
    )
    .eq("match_id", id)
    .order("created_at", { ascending: true });

  // Handle rink which might be an array or object
  const rink = Array.isArray(match.rink) ? match.rink[0] : match.rink;

  // Transform participants to handle user array
  const transformedParticipants = (participants || []).map((p) => {
    const user = Array.isArray(p.user) ? p.user[0] : p.user;
    return {
      ...p,
      user: user as MatchParticipant["user"],
    } as MatchParticipant;
  });

  return {
    ...match,
    rink: rink as MatchRink | null,
    participants: transformedParticipants,
  } as Match;
}

export async function joinMatch(matchId: string, position: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already joined
  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Already joined this match" };
  }

  const { error } = await supabase.from("participants").insert({
    match_id: matchId,
    user_id: user.id,
    position: position,
    status: "applied",
    payment_status: false,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function cancelJoin(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
