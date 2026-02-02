"use server";

import { createClient } from "@/lib/supabase/server";
import { Club, ClubMembership, ClubPost } from "./types";

// ============================================
// Club Logo Upload
// ============================================

export async function uploadClubLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("club-logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("club-logos")
    .getPublicUrl(fileName);

  return { url: publicUrl };
}

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

export async function getAdminClubs(): Promise<Club[]> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Superuser sees all clubs
  if (profile?.role === "superuser") {
    return getClubs();
  }

  // Regular Admin sees:
  // 1. Clubs they created
  // 2. Clubs they are a member of (any role, or specific role? User asked: "joined people". Assuming any member for now, or maybe expecting admins of clubs. The prompt says "admin user joined to that club". Usually implies club admin, but prompt says "joined". Let's assume all joined clubs are visible to the user IF they are an app-admin, or maybe just restrict to clubs they manage?
  // Re-reading request: "Among admins... creator... and admin users who are joined".
  // It suggests visibility. I will include all joined clubs.

  // 1. Created clubs
  const { data: createdClubs } = await supabase
    .from("clubs")
    .select("*")
    .eq("created_by", user.id)
    .order("name", { ascending: true });

  // For regular admins, ONLY show clubs they created (as per user request)
  // No longer showing clubs they joined.

  const clubsWithCounts = await Promise.all(
    (createdClubs || []).map(async (club) => {
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

  // Check if admin or superuser
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Admin access required" };
  }

  const name = formData.get("name") as string;
  const kakaoUrl = formData.get("kakao_open_chat_url") as string;
  const description = formData.get("description") as string;
  const logoUrl = formData.get("logo_url") as string;
  const repName = formData.get("rep_name") as string;
  const repPhone = formData.get("rep_phone") as string;

  if (!name?.trim()) {
    return { error: "Club name is required" };
  }

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name: name.trim(),
      kakao_open_chat_url: kakaoUrl?.trim() || null,
      description: description?.trim() || null,
      logo_url: logoUrl?.trim() || null,
      rep_name: repName?.trim() || null,
      rep_phone: repPhone?.trim() || null,
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
  const description = formData.get("description") as string;
  const logoUrl = formData.get("logo_url") as string;
  const repName = formData.get("rep_name") as string;
  const repPhone = formData.get("rep_phone") as string;

  const { error } = await supabase
    .from("clubs")
    .update({
      name: name?.trim(),
      kakao_open_chat_url: kakaoUrl?.trim() || null,
      description: description?.trim() || null,
      logo_url: logoUrl?.trim() || null,
      rep_name: repName?.trim() || null,
      rep_phone: repPhone?.trim() || null,
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

// ============================================
// Club Notices (Posts)
// ============================================

export async function getClubNotices(clubId: string): Promise<ClubPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_posts")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching club notices:", error);
    return [];
  }
  return data as ClubPost[];
}

export async function createClubNotice(clubId: string, title: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check permission: System Admin or Club Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("club_memberships")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  const isSystemAdmin = profile?.role === "admin" || profile?.role === "superuser";
  const isClubAdmin = membership?.role === "admin";

  if (!isSystemAdmin && !isClubAdmin) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("club_posts").insert({
    club_id: clubId,
    title,
    content,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
