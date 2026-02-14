"use server";

import { createClient } from "@/lib/supabase/server";

export interface MyMatch {
  id: string;
  start_time: string;
  fee: number;
  status: "open" | "closed" | "canceled";
  rink: {
    name_ko: string;
    name_en: string;
  } | null;
  participation: {
    id: string;
    position: "FW" | "DF" | "G";
    status: "applied" | "confirmed" | "pending_payment" | "waiting" | "canceled";
    payment_status: boolean;
  };
}

export async function getMyMatches(): Promise<MyMatch[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: participations, error } = await supabase
    .from("participants")
    .select(
      `
      id,
      position,
      status,
      payment_status,
      match:match_id(
        id,
        start_time,
        fee,
        status,
        rink:rink_id(name_ko, name_en)
      )
    `
    )
    .eq("user_id", user.id)
    .neq("status", "canceled")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my matches:", error);
    return [];
  }

  const now = new Date();
  const validMatches: MyMatch[] = [];
  const expiredParticipantIds: string[] = [];

  (participations || []).forEach((p) => {
    const match = Array.isArray(p.match) ? p.match[0] : p.match;
    // Check if pending_payment and expired
    if (p.status === "pending_payment" && match?.start_time && new Date(match.start_time) < now) {
      expiredParticipantIds.push(p.id);
      // We skip adding this to validMatches so it disappears immediately
    } else {
      const rink = match?.rink
        ? Array.isArray(match.rink)
          ? match.rink[0]
          : match.rink
        : null;

      validMatches.push({
        id: match?.id || "",
        start_time: match?.start_time || "",
        fee: match?.fee || 0,
        status: match?.status || "open",
        rink: rink as MyMatch["rink"],
        participation: {
          id: p.id,
          position: p.position,
          status: p.status,
          payment_status: p.payment_status,
        },
      });
    }
  });

  // Lazy Expiration: Cancel expired pending matches
  if (expiredParticipantIds.length > 0) {
    await supabase
      .from("participants")
      .update({ status: "canceled" })
      .in("id", expiredParticipantIds);
      
    console.log(`[LazyExpiration:MyPage] Canceled ${expiredParticipantIds.length} expired pending applications.`);
  }

  return validMatches;
}

export interface PendingRegularMatch {
  id: string;
  start_time: string;
  match_type: string;
  club: {
    id: string;
    name: string;
  } | null;
  rink: {
    name_ko: string;
    name_en: string;
  } | null;
}

export async function getMyPendingRegularMatches(): Promise<PendingRegularMatch[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get user's approved club IDs
  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("club_id")
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (!memberships || memberships.length === 0) return [];

  const clubIds = memberships.map((m) => m.club_id);

  // Get upcoming regular matches from those clubs
  const now = new Date().toISOString();
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      start_time,
      match_type,
      club:club_id(id, name),
      rink:rink_id(name_ko, name_en)
    `)
    .eq("match_type", "regular")
    .in("club_id", clubIds)
    .gte("start_time", now)
    .neq("status", "canceled")
    .order("start_time", { ascending: true });

  if (error || !matches) return [];

  // Get user's existing responses
  const matchIds = matches.map((m) => m.id);
  const { data: responses } = await supabase
    .from("regular_match_responses")
    .select("match_id")
    .eq("user_id", user.id)
    .in("match_id", matchIds);

  const respondedMatchIds = new Set((responses || []).map((r) => r.match_id));

  // Filter to only unreplied matches
  return matches
    .filter((m) => !respondedMatchIds.has(m.id))
    .map((m) => ({
      id: m.id,
      start_time: m.start_time,
      match_type: m.match_type,
      club: Array.isArray(m.club) ? m.club[0] : m.club,
      rink: Array.isArray(m.rink) ? m.rink[0] : m.rink,
    })) as PendingRegularMatch[];
}
