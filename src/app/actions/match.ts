"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateRefundPercent } from "./points";

// Type definitions for match data
export interface MatchRink {
  id: string;
  name_ko: string;
  name_en: string;
  map_url?: string;
  address?: string;
  rink_type?: "FULL" | "MINI";
  lat?: number;
  lng?: number;
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

export interface MatchClub {
  id: string;
  name: string;
  kakao_open_chat_url?: string;
  logo_url?: string;
}

export interface Match {
  id: string;
  start_time: string;
  fee: number;  // deprecated, use entry_points
  entry_points: number;
  max_skaters: number;
  max_goalies: number;
  status: "open" | "closed" | "canceled";
  description: string | null;
  bank_account?: string | null;
  rink: MatchRink | null;
  club?: MatchClub | null;
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
      entry_points,
      max_skaters,
      max_goalies,
      status,
      description,
      rink:rink_id(id, name_ko, name_en, address, lat, lng, rink_type),
      club:club_id(id, name, kakao_open_chat_url, logo_url)
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
      
      // Handle club
      const club = Array.isArray(match.club) ? match.club[0] : match.club;

      return {
        ...match,
        rink: rink as MatchRink | null,
        club: club as MatchClub | null,
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
      entry_points,
      max_skaters,
      max_goalies,
      status,
      description,
      bank_account,
      rink:rink_id(id, name_ko, name_en, map_url, lat, lng),
      club:club_id(id, name, kakao_open_chat_url, logo_url)
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
  
  // Handle club which might be an array or object
  const club = Array.isArray(match.club) ? match.club[0] : match.club;

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
    club: club as MatchClub | null,
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

  // Get match entry_points
  const { data: match } = await supabase
    .from("matches")
    .select("entry_points, status")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  if (match.status !== "open") {
    return { error: "Match is not open for registration" };
  }

  const entryPoints = match.entry_points || 0;

  // Get user's current points
  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const userPoints = profile?.points || 0;

  if (entryPoints > 0 && userPoints < entryPoints) {
    return { error: "Insufficient points", code: "INSUFFICIENT_POINTS" };
  }

  // Deduct points if entry_points > 0
  if (entryPoints > 0) {
    const newBalance = userPoints - entryPoints;
    
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ points: newBalance })
      .eq("id", user.id);

    if (pointsError) {
      return { error: "Failed to deduct points" };
    }

    // Record transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      type: "use",
      amount: -entryPoints,
      balance_after: newBalance,
      description: "경기 참가",
      reference_id: matchId,
    });
  }

  const { error } = await supabase.from("participants").insert({
    match_id: matchId,
    user_id: user.id,
    position: position,
    status: "applied",
    payment_status: entryPoints > 0,  // Auto-mark as paid if using points
  });

  if (error) {
    // Rollback points if participant insert failed
    if (entryPoints > 0) {
      await supabase
        .from("profiles")
        .update({ points: userPoints })
        .eq("id", user.id);
    }
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

  // Check if user is a participant
  const { data: participant } = await supabase
    .from("participants")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { error: "Not a participant" };
  }

  // Get match info for refund calculation
  const { data: match } = await supabase
    .from("matches")
    .select("entry_points, start_time")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  const entryPoints = match.entry_points || 0;
  let refundAmount = 0;

  // Calculate refund based on policy
  if (entryPoints > 0) {
    const refundPercent = await calculateRefundPercent(match.start_time);
    refundAmount = Math.floor(entryPoints * refundPercent / 100);
  }

  // Delete participation
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Refund points if applicable
  if (refundAmount > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points || 0;
    const newBalance = currentPoints + refundAmount;

    await supabase
      .from("profiles")
      .update({ points: newBalance })
      .eq("id", user.id);

    // Record transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      type: "refund",
      amount: refundAmount,
      balance_after: newBalance,
      description: `경기 취소 환불 (${Math.floor(refundAmount / entryPoints * 100)}%)`,
      reference_id: matchId,
    });
  }

  return { success: true, refundAmount };
}
