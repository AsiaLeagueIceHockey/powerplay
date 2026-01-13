"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get all rinks for dropdown
export async function getRinks() {
  const supabase = await createClient();

  const { data: rinks, error } = await supabase
    .from("rinks")
    .select("id, name_ko, name_en")
    .order("name_ko");

  if (error) {
    console.error("Error fetching rinks:", error);
    return [];
  }

  return rinks || [];
}

// Create a new match
export async function createMatch(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const rinkId = formData.get("rink_id") as string;
  const startTimeInput = formData.get("start_time") as string;
  const fee = parseInt(formData.get("fee") as string) || 0;
  const maxFw = parseInt(formData.get("max_fw") as string) || 8;
  const maxDf = parseInt(formData.get("max_df") as string) || 4;
  const maxG = parseInt(formData.get("max_g") as string) || 2;
  const description = formData.get("description") as string;
  const bankAccount = formData.get("bank_account") as string;

  // datetime-local 입력은 KST로 가정, UTC로 변환하여 저장
  // 입력: "2026-01-11T00:00" (KST) → 저장: "2026-01-10T15:00:00.000Z" (UTC)
  const startTimeUTC = new Date(startTimeInput + "+09:00").toISOString();

  const { data, error } = await supabase
    .from("matches")
    .insert({
      rink_id: rinkId || null,
      start_time: startTimeUTC,
      fee,
      max_fw: maxFw,
      max_df: maxDf,
      max_g: maxG,
      description: description || null,
      bank_account: bankAccount || null,
      status: "open",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");
  return { success: true, matchId: data.id };
}

// Update an existing match
export async function updateMatch(matchId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const rinkId = formData.get("rink_id") as string;
  const startTimeInput = formData.get("start_time") as string;
  const fee = parseInt(formData.get("fee") as string) || 0;
  const maxFw = parseInt(formData.get("max_fw") as string) || 8;
  const maxDf = parseInt(formData.get("max_df") as string) || 4;
  const maxG = parseInt(formData.get("max_g") as string) || 2;
  const description = formData.get("description") as string;
  const bankAccount = formData.get("bank_account") as string;
  const status = formData.get("status") as string;

  // datetime-local 입력은 KST로 가정, UTC로 변환하여 저장
  const startTimeUTC = new Date(startTimeInput + "+09:00").toISOString();

  const { error } = await supabase
    .from("matches")
    .update({
      rink_id: rinkId || null,
      start_time: startTimeUTC,
      fee,
      max_fw: maxFw,
      max_df: maxDf,
      max_g: maxG,
      description: description || null,
      bank_account: bankAccount || null,
      status: status as "open" | "closed" | "canceled",
    })
    .eq("id", matchId);

  if (error) {
    console.error("Error updating match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}/edit`);
  return { success: true };
}

// Toggle participant payment status
export async function updatePaymentStatus(
  participantId: string,
  paymentStatus: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("participants")
    .update({ payment_status: paymentStatus })
    .eq("id", participantId);

  if (error) {
    console.error("Error updating payment status:", error);
    return { error: error.message };
  }

  return { success: true };
}

// Delete a match
export async function deleteMatch(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    console.error("Error deleting match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");
  return { success: true };
}

// Get admin matches (created by current user)
export async function getAdminMatches() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return [];
  }

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
      rink:rink_id(name_ko, name_en),
      created_by
    `
    )
    .eq("created_by", user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching admin matches:", error);
    return [];
  }

  // Fetch participants for each match
  const matchesWithParticipants = await Promise.all(
    matches.map(async (match) => {
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
        .eq("match_id", match.id)
        .order("created_at", { ascending: true });

      // Calculate counts
      const counts = {
        fw: participants?.filter((p) => p.position === "FW" && ["applied", "confirmed"].includes(p.status)).length || 0,
        df: participants?.filter((p) => p.position === "DF" && ["applied", "confirmed"].includes(p.status)).length || 0,
        g: participants?.filter((p) => p.position === "G" && ["applied", "confirmed"].includes(p.status)).length || 0,
      };

      // Transform participants similar to getMatch
      const transformedParticipants = (participants || []).map((p) => {
        const user = Array.isArray(p.user) ? p.user[0] : p.user;
        return {
          ...p,
          user,
        };
      });

      return {
        ...match,
        participants: transformedParticipants,
        participants_count: counts,
        rink: Array.isArray(match.rink) ? match.rink[0] : match.rink,
      };
    })
  );

  return matchesWithParticipants;
}

// ==================== RINK CRUD ====================

// Parse Naver Map URL to extract coordinates
export async function parseNaverMapUrl(url: string): Promise<{
  success: boolean;
  data?: { lat: number; lng: number; address: string; mapUrl: string };
  error?: string;
}> {
  try {
    // Follow redirects to get the full URL
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    const finalUrl = response.url;

    // Extract lat and lng from URL params
    const urlObj = new URL(finalUrl);
    const lat = urlObj.searchParams.get("lat");
    const lng = urlObj.searchParams.get("lng");

    if (!lat || !lng) {
      return { success: false, error: "좌표를 추출할 수 없습니다. 올바른 네이버 지도 URL인지 확인해주세요." };
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return { success: false, error: "좌표 형식이 올바르지 않습니다." };
    }

    // Use Naver Reverse Geocoding API to get address
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

    let address = "";

    if (clientId && clientSecret) {
      try {
        const geocodeResponse = await fetch(
          `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&output=json&orders=roadaddr,addr`,
          {
            headers: {
              "X-NCP-APIGW-API-KEY-ID": clientId,
              "X-NCP-APIGW-API-KEY": clientSecret,
            },
          }
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          // Extract address from response
          const results = geocodeData.results;
          if (results && results.length > 0) {
            const result = results[0];
            const region = result.region;
            const land = result.land;

            if (result.name === "roadaddr" && land) {
              // Road address format
              address = `${region.area1.name} ${region.area2.name} ${region.area3.name} ${land.name} ${land.number1}${land.number2 ? "-" + land.number2 : ""}`;
            } else if (region) {
              // Lot number address format
              address = `${region.area1.name} ${region.area2.name} ${region.area3.name}${region.area4?.name ? " " + region.area4.name : ""}`;
            }
          }
        }
      } catch (geocodeError) {
        console.error("Reverse geocoding failed:", geocodeError);
        // Continue without address - user can enter manually if needed
      }
    }

    return {
      success: true,
      data: {
        lat: latitude,
        lng: longitude,
        address: address.trim(),
        mapUrl: url, // Store original short URL
      },
    };
  } catch (error) {
    console.error("Error parsing Naver Map URL:", error);
    return { success: false, error: "URL을 파싱하는 중 오류가 발생했습니다." };
  }
}

// Create a new rink
export async function createRink(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const nameKo = formData.get("name_ko") as string;
  const nameEn = formData.get("name_en") as string;
  const mapUrl = formData.get("map_url") as string;
  const address = formData.get("address") as string;
  const lat = formData.get("lat") as string;
  const lng = formData.get("lng") as string;
  const rinkType = formData.get("rink_type") as string;

  if (!nameKo || !nameEn) {
    return { error: "이름은 필수입니다 (한국어, 영어)" };
  }

  const { data, error } = await supabase
    .from("rinks")
    .insert({
      name_ko: nameKo,
      name_en: nameEn,
      map_url: mapUrl || null,
      address: address || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      rink_type: rinkType || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating rink:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/rinks");
  return { success: true, rinkId: data.id };
}

// Update an existing rink
export async function updateRink(rinkId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const nameKo = formData.get("name_ko") as string;
  const nameEn = formData.get("name_en") as string;
  const mapUrl = formData.get("map_url") as string;
  const address = formData.get("address") as string;
  const lat = formData.get("lat") as string;
  const lng = formData.get("lng") as string;
  const rinkType = formData.get("rink_type") as string;

  const { error } = await supabase
    .from("rinks")
    .update({
      name_ko: nameKo,
      name_en: nameEn,
      map_url: mapUrl || null,
      address: address || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      rink_type: rinkType || null,
    })
    .eq("id", rinkId);

  if (error) {
    console.error("Error updating rink:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/rinks");
  return { success: true };
}

// Delete a rink
export async function deleteRink(rinkId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("rinks").delete().eq("id", rinkId);

  if (error) {
    console.error("Error deleting rink:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/rinks");
  return { success: true };
}

// Get a single rink
export async function getRink(rinkId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rinks")
    .select("*")
    .eq("id", rinkId)
    .single();

  if (error) {
    console.error("Error fetching rink:", error);
    return null;
  }

  return data;
}
