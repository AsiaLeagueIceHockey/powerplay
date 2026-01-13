"use server";

import { createClient } from "@/lib/supabase/server";
import { Club, ClubMembership } from "./types";

// ============================================
// Club CRUD Operations
// ============================================

export async function getClubs(): Promise<Club[]> {
  const supabase = await createClient();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }

  // Get member counts for each club
  const clubsWithCounts = await Promise.all(
    (clubs || []).map(async (club) => {
      const { count } = await supabase
        .from("club_memberships")
        .select("*", { count: "exact", head: true })
        .eq("club_id", club.id);

      return {
        ...club,
        member_count: count || 0,
      } as Club;
    })
  );

  return clubsWithCounts;
}

export async function getClub(id: string): Promise<Club | null> {
  const supabase = await createClient();

  const { data: club, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching club:", error);
    return null;
  }

  return club as Club;
}

export async function createClub(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Admin access required" };
  }

  const name = formData.get("name") as string;
  const kakaoUrl = formData.get("kakao_open_chat_url") as string;

  if (!name?.trim()) {
    return { error: "Club name is required" };
  }

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name: name.trim(),
      kakao_open_chat_url: kakaoUrl?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating club:", error);
    return { error: error.message };
  }

  // Auto-join creator as admin
  await supabase.from("club_memberships").insert({
    club_id: club.id,
    user_id: user.id,
    role: "admin",
  });

  return { success: true, club };
}

export async function updateClub(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const kakaoUrl = formData.get("kakao_open_chat_url") as string;

  const { error } = await supabase
    .from("clubs")
    .update({
      name: name?.trim(),
      kakao_open_chat_url: kakaoUrl?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============================================
// Club Membership Operations
// ============================================

export async function getMyClubs(): Promise<ClubMembership[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: memberships, error } = await supabase
    .from("club_memberships")
    .select(`
      id,
      club_id,
      user_id,
      role,
      created_at,
      club:club_id(id, name, kakao_open_chat_url)
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching my clubs:", error);
    return [];
  }

  // Transform to handle joined club data
  return (memberships || []).map((m) => ({
    ...m,
    club: Array.isArray(m.club) ? m.club[0] : m.club,
  })) as ClubMembership[];
}

export async function joinClub(clubId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Already a member of this club" };
  }

  const { error } = await supabase.from("club_memberships").insert({
    club_id: clubId,
    user_id: user.id,
    role: "member",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function leaveClub(clubId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("club_memberships")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============================================
// Helper: Check if user is member of a club
// ============================================

export async function isClubMember(clubId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  return !!data;
}
