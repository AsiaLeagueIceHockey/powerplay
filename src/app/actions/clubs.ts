"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CLUB_VOTE_DAILY_LIMIT, getKstDateKey, getKstMonthKey } from "@/lib/club-voting";
import { Club, ClubMembership, ClubPost, Rink } from "./types";
import { logAndNotify } from "@/lib/audit";
import { checkIsSuperUser } from "./superuser";
import { sendPushNotification } from "./push";

type ClubWithRinksRow = Club & {
  club_rinks?: Array<{ rink: Rink | null }> | null;
};

type ClubMembershipUserRow = {
  user:
    | {
        full_name: string | null;
        email: string | null;
      }
    | Array<{
        full_name: string | null;
        email: string | null;
      }>
    | null;
};

export interface ClubDeleteImpact {
  clubId: string;
  clubName: string;
  memberCount: number;
  noticeCount: number;
  rinkCount: number;
  linkedMatchCount: number;
  futureLinkedMatchCount: number;
  primaryProfileCount: number;
}

const CLUB_LOCALES = ["ko", "en"] as const;

export interface ClubVoteSummary {
  isLoggedIn: boolean;
  dailyLimit: number;
  remainingDailyVotes: number;
  votedClubIdsToday: string[];
  todayKey: string;
  monthKey: string;
}

type CastClubVoteRpcRow = {
  vote_id: string;
  vote_date_kst: string;
  vote_month_kst: string;
  remaining_daily_votes: number;
  monthly_vote_count: number;
};

type ClubMemberCountRow = {
  club_id: string;
  member_count: number | string | null;
};

type ClubMembershipSource = "legacy_join" | "club_create" | "manual_subscribe" | "primary_club";

function revalidateClubPaths(clubId?: string) {
  revalidateTag("clubs", "max");
  revalidatePath("/sitemap.xml");

  for (const locale of CLUB_LOCALES) {
    revalidatePath(`/${locale}/clubs`);
    revalidatePath(`/${locale}/admin/clubs`);

    if (clubId) {
      revalidatePath(`/${locale}/clubs/${clubId}`);
      revalidatePath(`/${locale}/clubs/${clubId}/card`);
      revalidatePath(`/${locale}/admin/clubs/${clubId}/edit`);
    }
  }
}

function normalizeClubVoteError(errorMessage?: string) {
  if (!errorMessage) {
    return "UNKNOWN_ERROR";
  }

  if (errorMessage.includes("AUTH_REQUIRED")) return "AUTH_REQUIRED";
  if (errorMessage.includes("CLUB_REQUIRED")) return "CLUB_REQUIRED";
  if (errorMessage.includes("CLUB_NOT_FOUND")) return "CLUB_NOT_FOUND";
  if (errorMessage.includes("DAILY_LIMIT_REACHED")) return "DAILY_LIMIT_REACHED";
  if (errorMessage.includes("ALREADY_VOTED_TODAY")) return "ALREADY_VOTED_TODAY";

  return "UNKNOWN_ERROR";
}

async function ensureClubMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  userId: string,
  source: ClubMembershipSource,
  role: "admin" | "member" = "member"
) {
  const { data: existingMembership, error: existingMembershipError } = await supabase
    .from("club_memberships")
    .select("id, role, source")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMembershipError) {
    return { error: existingMembershipError.message, created: false };
  }

  if (existingMembership) {
    return { created: false };
  }

  const { error: insertError } = await supabase.from("club_memberships").insert({
    club_id: clubId,
    user_id: userId,
    role,
    source,
  });

  if (insertError) {
    return { error: insertError.message, created: false };
  }

  return { created: true };
}

async function fetchClubMemberCountMap(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data, error } = await supabase.rpc("get_public_club_member_counts");

  if (error) {
    console.error("Error fetching public club member counts:", error);
    return new Map<string, number>();
  }

  return new Map(
    ((data || []) as ClubMemberCountRow[]).map((row) => [row.club_id, Number(row.member_count ?? 0)])
  );
}

function extractClubLogoStoragePath(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) {
    return null;
  }

  const marker = "/storage/v1/object/public/club-logos/";
  const markerIndex = logoUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(logoUrl.slice(markerIndex + marker.length));
}

async function getClubDeleteImpactSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string
): Promise<
  | {
      club: { id: string; name: string; logo_url: string | null };
      impact: ClubDeleteImpact;
    }
  | { error: string }
> {
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name, logo_url")
    .eq("id", clubId)
    .single();

  if (clubError || !club) {
    return { error: "Club not found" };
  }

  const nowIso = new Date().toISOString();

  const [
    membershipCountResult,
    noticeCountResult,
    rinkCountResult,
    linkedMatchCountResult,
    futureLinkedMatchCountResult,
    primaryProfileCountResult,
  ] = await Promise.all([
    supabase.from("club_memberships").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("club_posts").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("club_rinks").select("club_id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("start_time", nowIso)
      .neq("status", "canceled"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("primary_club_id", clubId),
  ]);

  const countErrors = [
    membershipCountResult.error,
    noticeCountResult.error,
    rinkCountResult.error,
    linkedMatchCountResult.error,
    futureLinkedMatchCountResult.error,
    primaryProfileCountResult.error,
  ].filter(Boolean);

  if (countErrors.length > 0) {
    console.error("Error loading club delete impact:", countErrors);
    return { error: "Failed to load club delete impact" };
  }

  return {
    club,
    impact: {
      clubId: club.id,
      clubName: club.name,
      memberCount: membershipCountResult.count || 0,
      noticeCount: noticeCountResult.count || 0,
      rinkCount: rinkCountResult.count || 0,
      linkedMatchCount: linkedMatchCountResult.count || 0,
      futureLinkedMatchCount: futureLinkedMatchCountResult.count || 0,
      primaryProfileCount: primaryProfileCountResult.count || 0,
    },
  };
}

function extractClubRinks(club: ClubWithRinksRow): Rink[] {
  return club.club_rinks?.map((clubRink) => clubRink.rink).filter((rink): rink is Rink => Boolean(rink)) || [];
}

function extractClubMembers(membersData: ClubMembershipUserRow[] | null | undefined) {
  return (membersData || []).map((member) => {
    const user = Array.isArray(member.user) ? member.user[0] : member.user;

    return {
      full_name: user?.full_name || null,
      email: user?.email || "",
    };
  });
}

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
  const memberCountMapPromise = fetchClubMemberCountMap(supabase);

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*, club_rinks(rink:rinks(*))")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }

  // Get member counts for each club
  const memberCountMap = await memberCountMapPromise;
  const clubsWithCounts = await Promise.all(
    (clubs || []).map(async (club) => {
      // Fetch detailed member info
      const { data: membersData } = await supabase
        .from("club_memberships")
        .select("user:profiles(full_name, email)")
        .eq("club_id", club.id);

      const rinks = extractClubRinks(club as ClubWithRinksRow);
      const members = extractClubMembers(membersData as ClubMembershipUserRow[] | null);

      return {
        ...club,
        member_count: memberCountMap.get(club.id) ?? 0,
        rinks,
        members,
      } as Club;
    })
  );

  return clubsWithCounts;
}

export async function getAdminClubs(): Promise<Club[]> {
  const supabase = await createClient();
  const memberCountMapPromise = fetchClubMemberCountMap(supabase);
  
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

  const memberCountMap = await memberCountMapPromise;
  const clubsWithCounts = await Promise.all(
    (createdClubs || []).map(async (club) => {
      // Fetch detailed member info
      const { data: membersData } = await supabase
        .from("club_memberships")
        .select("user:profiles(full_name, email)")
        .eq("club_id", club.id);

      const rinks = extractClubRinks(club as ClubWithRinksRow);
      const members = extractClubMembers(membersData as ClubMembershipUserRow[] | null);

      return {
        ...club,
        member_count: memberCountMap.get(club.id) ?? 0,
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

  const rinks = extractClubRinks(club as ClubWithRinksRow);

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
    source: "club_create",
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
    description: `새 동호회 '${name}'를 생성했습니다.`,
    metadata: { clubId: club.id, name },
  });

  revalidateClubPaths(club.id);

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

  revalidateClubPaths(id);

  return { success: true };
}

export async function getClubDeleteImpact(clubId: string): Promise<{
  success: boolean;
  impact?: ClubDeleteImpact;
  error?: string;
}> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const snapshot = await getClubDeleteImpactSnapshot(supabase, clubId);

  if ("error" in snapshot) {
    return { success: false, error: snapshot.error };
  }

  return { success: true, impact: snapshot.impact };
}

export async function deleteClub(clubId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const snapshot = await getClubDeleteImpactSnapshot(supabase, clubId);

  if ("error" in snapshot) {
    return { success: false, error: snapshot.error };
  }

  const logoPath = extractClubLogoStoragePath(snapshot.club.logo_url);
  if (logoPath) {
    const { error: storageError } = await supabase.storage.from("club-logos").remove([logoPath]);
    if (storageError) {
      console.error("Error deleting club logo:", storageError);
    }
  }

  const { error } = await supabase.from("clubs").delete().eq("id", clubId);

  if (error) {
    console.error("Error deleting club:", error);
    return { success: false, error: error.message };
  }

  revalidateClubPaths(clubId);

  await logAndNotify({
    userId: user.id,
    action: "CLUB_DELETE",
    description: `동호회 '${snapshot.club.name}'를 삭제했습니다.`,
    metadata: { ...snapshot.impact },
    skipPush: true,
    url: "/ko/admin/clubs",
  });

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
      source,
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

export async function getMyManagedClubs(): Promise<ClubMembership[]> {
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
      source,
      created_at,
      club:club_id(id, name, kakao_open_chat_url)
    `)
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (error) {
    console.error("Error fetching my managed clubs:", error);
    return [];
  }

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

  const membershipResult = await ensureClubMembership(supabase, clubId, user.id, "manual_subscribe");

  if (membershipResult.error) {
    return { error: membershipResult.error };
  }

  revalidateClubPaths(clubId);

  return { success: true };
}

export async function subscribeToClubNews(clubId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("id", clubId)
    .maybeSingle();

  if (clubError || !club) {
    return { error: "Club not found" };
  }

  const membershipResult = await ensureClubMembership(supabase, clubId, user.id, "manual_subscribe");

  if (membershipResult.error) {
    return { error: membershipResult.error };
  }

  revalidateClubPaths(clubId);

  return { success: true, alreadySubscribed: !membershipResult.created };
}

export async function getMyClubVoteSummary(): Promise<ClubVoteSummary> {
  const supabase = await createClient();
  const todayKey = getKstDateKey(new Date());
  const monthKey = getKstMonthKey(new Date());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isLoggedIn: false,
      dailyLimit: CLUB_VOTE_DAILY_LIMIT,
      remainingDailyVotes: CLUB_VOTE_DAILY_LIMIT,
      votedClubIdsToday: [],
      todayKey,
      monthKey,
    };
  }

  const { data, error } = await supabase
    .from("club_votes")
    .select("club_id")
    .eq("user_id", user.id)
    .eq("vote_date_kst", todayKey);

  if (error) {
    console.error("Error fetching club vote summary:", error);
    return {
      isLoggedIn: true,
      dailyLimit: CLUB_VOTE_DAILY_LIMIT,
      remainingDailyVotes: CLUB_VOTE_DAILY_LIMIT,
      votedClubIdsToday: [],
      todayKey,
      monthKey,
    };
  }

  const votedClubIdsToday = (data || []).map((vote) => vote.club_id);

  return {
    isLoggedIn: true,
    dailyLimit: CLUB_VOTE_DAILY_LIMIT,
    remainingDailyVotes: Math.max(0, CLUB_VOTE_DAILY_LIMIT - votedClubIdsToday.length),
    votedClubIdsToday,
    todayKey,
    monthKey,
  };
}

export async function castClubVote(clubId: string): Promise<{
  success: boolean;
  error?: string;
  remainingDailyVotes?: number;
  monthlyVoteCount?: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "AUTH_REQUIRED" };
  }

  const { data, error } = await supabase.rpc("cast_club_vote", {
    target_club_id: clubId,
  });

  if (error) {
    console.error("Error casting club vote:", error);
    return { success: false, error: normalizeClubVoteError(error.message) };
  }

  const vote = ((data || []) as CastClubVoteRpcRow[])[0];

  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", clubId)
    .maybeSingle();

  await logAndNotify({
    userId: user.id,
    action: "CLUB_VOTE",
    description: `'${club?.name || "알 수 없는 동호회"}'에 응원 투표를 남겼습니다.`,
    metadata: {
      clubId,
      clubName: club?.name || null,
      voteDateKst: vote?.vote_date_kst ?? null,
      voteMonthKst: vote?.vote_month_kst ?? null,
      remainingDailyVotes: vote?.remaining_daily_votes ?? 0,
      monthlyVoteCount: vote?.monthly_vote_count ?? 0,
    },
  });

  revalidateClubPaths(clubId);

  return {
    success: true,
    remainingDailyVotes: vote?.remaining_daily_votes ?? 0,
    monthlyVoteCount: vote?.monthly_vote_count ?? 0,
  };
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

  revalidateClubPaths(clubId);

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

  const [{ data: club }, { data: subscribers, error: subscribersError }] = await Promise.all([
    supabase.from("clubs").select("name").eq("id", clubId).maybeSingle(),
    supabase
      .from("club_memberships")
      .select("user_id")
      .eq("club_id", clubId)
      .neq("user_id", user.id),
  ]);

  if (subscribersError) {
    console.error("Error fetching club notice subscribers:", subscribersError);
  } else if (subscribers && subscribers.length > 0) {
    const clubName = club?.name || "PowerPlay";
    const pushTitle = `${clubName} 새 공지`;
    const pushBody = title;
    const noticeUrl = `/ko/clubs/${clubId}`;

    const uniqueUserIds = Array.from(new Set(subscribers.map((subscriber) => subscriber.user_id)));

    const pushResults = await Promise.allSettled(
      uniqueUserIds.map((targetUserId) =>
        sendPushNotification(targetUserId, pushTitle, pushBody, noticeUrl)
      )
    );

    for (const result of pushResults) {
      if (result.status === "rejected") {
        console.error("Failed to send club notice push:", result.reason);
      }
    }
  }

  revalidateClubPaths(clubId);

  return { success: true };
}
