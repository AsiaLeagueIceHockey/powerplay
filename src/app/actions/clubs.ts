"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Club, ClubMembership, ClubPost } from "./types";
import { logAndNotify } from "@/lib/audit";
import { sendPushToClubAdmin, sendPushNotification } from "@/app/actions/push";

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

export async function getMyClubMembershipStatuses(): Promise<Record<string, "approved" | "pending" | "rejected">> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  const { data: memberships } = await supabase
    .from("club_memberships")
    .select("club_id, status")
    .eq("user_id", user.id);

  const statusMap: Record<string, "approved" | "pending" | "rejected"> = {};
  memberships?.forEach((m) => {
    statusMap[m.club_id] = m.status;
  });

  return statusMap;
}

export async function getClubs(): Promise<Club[]> {
  const supabase = await createClient();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*, club_rinks(rink:rinks(*))")
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
        .eq("club_id", club.id)
        .eq("status", "approved");

      // Fetch detailed member info
      const { data: membersData } = await supabase
        .from("club_memberships")
        .select("user:profiles(full_name, email)")
        .eq("club_id", club.id)
        .eq("status", "approved");

      // Transform club_rinks to rinks
      // @ts-ignore
      const rinks = club.club_rinks?.map((cr) => cr.rink).filter(Boolean) || [];

      // Transform members data
      const members = membersData?.map((m: any) => ({
        full_name: m.user?.full_name || null,
        email: m.user?.email || "",
      })) || [];

      return {
        ...club,
        member_count: count || 0,
        rinks,
        members,
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
    .select("*, club_rinks(rink:rinks(*))")
    .eq("created_by", user.id)
    .order("name", { ascending: true });

  // For regular admins, ONLY show clubs they created (as per user request)
  // No longer showing clubs they joined.

  const clubsWithCounts = await Promise.all(
    (createdClubs || []).map(async (club) => {
      const { count } = await supabase
        .from("club_memberships")
        .select("*", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("status", "approved");

      // Fetch detailed member info
      const { data: membersData } = await supabase
        .from("club_memberships")
        .select("user:profiles(full_name, email)")
        .eq("club_id", club.id)
        .eq("status", "approved");

      // Transform club_rinks to rinks
      // @ts-ignore
      const rinks = club.club_rinks?.map((cr) => cr.rink).filter(Boolean) || [];

      // Transform members data
      const members = membersData?.map((m) => ({
        full_name: (m.user as any)?.full_name || null,
        email: (m.user as any)?.email || "",
      })) || [];

      return {
        ...club,
        member_count: count || 0,
        rinks,
        members,
      } as Club;
    })
  );

  return clubsWithCounts;
}

export async function getClub(id: string): Promise<Club | null> {
  const supabase = await createClient();

  const { data: club, error } = await supabase
    .from("clubs")
    .select("*, club_rinks(rink:rinks(*))")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching club:", error);
    return null;
  }

  // Transform club_rinks to rinks
  // @ts-ignore
  const rinks = club.club_rinks?.map((cr) => cr.rink).filter(Boolean) || [];

  return {
      ...club,
      rinks,
  } as Club;
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
  const rinkIds = formData.getAll("rink_id") as string[];

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

  // Insert associated rinks
  if (rinkIds.length > 0) {
    const clubRinks = rinkIds.map((rinkId) => ({
      club_id: club.id,
      rink_id: rinkId,
    }));
    await supabase.from("club_rinks").insert(clubRinks);
  }

  // Audit Log (Background)
  await logAndNotify({
    userId: user.id,
    action: "CLUB_CREATE",
    description: `${user.email}님이 새 동호회 '${name}'를 생성했습니다.`,
    metadata: { clubId: club.id, name },
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
  const rinkIds = formData.getAll("rink_id") as string[];

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

  // Update Rinks
  // 1. Delete existing
  await supabase.from("club_rinks").delete().eq("club_id", id);

  // 2. Insert new
  if (rinkIds.length > 0) {
    const clubRinks = rinkIds.map((rinkId) => ({
      club_id: id,
      rink_id: rinkId,
    }));
    await supabase.from("club_rinks").insert(clubRinks);
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
      status,
      created_at,
      club:club_id(id, name, kakao_open_chat_url)
    `)
    .eq("user_id", user.id)
    .eq("status", "approved");

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

export async function joinClub(clubId: string, introMessage?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already a member or pending
  const { data: existing } = await supabase
    .from("club_memberships")
    .select("id, status")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.status === "pending") {
      return { error: "already_pending" };
    }
    if (existing.status === "approved") {
      return { error: "already_member" };
    }
    // If rejected, allow re-apply by updating
    const { error: updateError } = await supabase
      .from("club_memberships")
      .update({ status: "pending", intro_message: introMessage?.trim() || null })
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error } = await supabase.from("club_memberships").insert({
      club_id: clubId,
      user_id: user.id,
      role: "member",
      status: "pending",
      intro_message: introMessage?.trim() || null,
    });

    if (error) {
      return { error: error.message };
    }
  }

  // Get user profile for notification
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || profile?.email || "새 사용자";

  // Get club name for notification
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", clubId)
    .single();

  // Send push notification to club admin
  try {
    await sendPushToClubAdmin(
      clubId,
      `📋 동호회 가입 신청`,
      `${userName}님이 '${club?.name || "동호회"}'에 가입을 신청했습니다.`,
      `/admin/clubs`
    );
  } catch (e) {
    console.error("Failed to send push to club admin:", e);
  }

  return { success: true, status: "pending" };
}

// ============================================
// Club Membership Approval
// ============================================

export async function approveClubMember(membershipId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check if current user is club admin or system admin
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("club_id, user_id, status, club:club_id(created_by, name)")
    .eq("id", membershipId)
    .single();

  if (!membership) return { error: "Membership not found" };

  const club = Array.isArray(membership.club) ? membership.club[0] : membership.club;

  // Check permission
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSystemAdmin = profile?.role === "admin" || profile?.role === "superuser";
  const isClubCreator = (club as any)?.created_by === user.id;

  if (!isSystemAdmin && !isClubCreator) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("club_memberships")
    .update({ status: "approved" })
    .eq("id", membershipId);

  if (error) return { error: error.message };

  // Send push notification to the user
  try {
    const clubName = (club as any)?.name || "동호회";
    await sendPushNotification(
      membership.user_id,
      "동호회 가입 승인 🎉",
      `'${clubName}' 가입이 승인되었습니다. 이제 동호회 활동을 시작해보세요!`,
      `/clubs/${membership.club_id}`
    );
  } catch (e) {
    console.error("Failed to send push to user:", e);
  }

  return { success: true };
}

export async function rejectClubMember(membershipId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check if current user is club admin or system admin
  const { data: membership } = await supabase
    .from("club_memberships")
    .select("club_id, user_id, status, club:club_id(created_by)")
    .eq("id", membershipId)
    .single();

  if (!membership) return { error: "Membership not found" };

  const club = Array.isArray(membership.club) ? membership.club[0] : membership.club;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSystemAdmin = profile?.role === "admin" || profile?.role === "superuser";
  const isClubCreator = (club as any)?.created_by === user.id;

  if (!isSystemAdmin && !isClubCreator) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("club_memberships")
    .update({ status: "rejected" })
    .eq("id", membershipId);

  if (error) return { error: error.message };

  return { success: true };
}

export async function getPendingMembers(clubId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("club_memberships")
    .select(`
      id,
      club_id,
      user_id,
      role,
      status,
      intro_message,
      created_at,
      user:profiles(id, full_name, email, position)
    `)
    .eq("club_id", clubId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending members:", error);
    return [];
  }

  return (data || []).map((m: any) => ({
    ...m,
    user: Array.isArray(m.user) ? m.user[0] : m.user,
  }));
}

export async function getClubMembershipStatus(clubId: string): Promise<"approved" | "pending" | "rejected" | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("club_memberships")
    .select("status")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  return data?.status || null;
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
