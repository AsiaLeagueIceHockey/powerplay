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
    status: "applied" | "confirmed" | "waiting" | "canceled";
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

  return (participations || []).map((p) => {
    const match = Array.isArray(p.match) ? p.match[0] : p.match;
    const rink = match?.rink
      ? Array.isArray(match.rink)
        ? match.rink[0]
        : match.rink
      : null;

    return {
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
    } as MyMatch;
  });
}
