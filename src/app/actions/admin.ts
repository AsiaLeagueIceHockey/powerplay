"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendPushNotification } from "@/app/actions/push";
import { logAndNotify } from "@/lib/audit";
import type { LoungeBusinessCategory } from "@/lib/lounge-business-category";
import { isAllowedNaverMapUrl } from "@/lib/lounge-link-utils";
import { MAX_MATCH_ENTRY_POINTS } from "@/lib/match-entry-limit";

const MATCH_ENTRY_LIMIT_ERROR_KO = "동호회 경기 참가비는 최대 30,000원까지 입력할 수 있습니다.";
const RINK_DELETE_UNAUTHORIZED_ERROR = "Unauthorized";

export interface RinkDeleteImpact {
  rinkId: string;
  rinkNameKo: string;
  rinkNameEn: string;
  clubLinkCount: number;
  linkedMatchCount: number;
  futureLinkedMatchCount: number;
  approved: boolean;
}

function revalidateRinkPaths(rinkId?: string) {
  revalidateTag("rinks", "max");
  revalidateTag("matches", "max");
  revalidateTag("clubs", "max");

  const locales = ["ko", "en"] as const;
  for (const locale of locales) {
    revalidatePath(`/${locale}/admin/rinks`);
    revalidatePath(`/${locale}/admin/matches`);
    revalidatePath(`/${locale}/rinks`);

    if (rinkId) {
      revalidatePath(`/${locale}/admin/rinks/${rinkId}/edit`);
      revalidatePath(`/${locale}/rinks/${rinkId}`);
    }
  }
}

async function getRinkDeleteImpactSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rinkId: string
): Promise<
  | {
      rink: { id: string; name_ko: string; name_en: string; is_approved: boolean };
      impact: RinkDeleteImpact;
    }
  | { error: string }
> {
  const { data: rink, error: rinkError } = await supabase
    .from("rinks")
    .select("id, name_ko, name_en, is_approved")
    .eq("id", rinkId)
    .single();

  if (rinkError || !rink) {
    return { error: "Rink not found" };
  }

  const nowIso = new Date().toISOString();

  const [clubLinkCountResult, linkedMatchCountResult, futureLinkedMatchCountResult] = await Promise.all([
    supabase.from("club_rinks").select("rink_id", { count: "exact", head: true }).eq("rink_id", rinkId),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("rink_id", rinkId),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("rink_id", rinkId)
      .gte("start_time", nowIso)
      .neq("status", "canceled"),
  ]);

  const countErrors = [clubLinkCountResult.error, linkedMatchCountResult.error, futureLinkedMatchCountResult.error]
    .filter(Boolean);

  if (countErrors.length > 0) {
    console.error("Error loading rink delete impact:", countErrors);
    return { error: "Failed to load rink delete impact" };
  }

  return {
    rink,
    impact: {
      rinkId: rink.id,
      rinkNameKo: rink.name_ko,
      rinkNameEn: rink.name_en,
      clubLinkCount: clubLinkCountResult.count || 0,
      linkedMatchCount: linkedMatchCountResult.count || 0,
      futureLinkedMatchCount: futureLinkedMatchCountResult.count || 0,
      approved: rink.is_approved,
    },
  };
}

// Get all rinks for dropdown
export async function getRinks() {
  const supabase = await createClient();

  const { data: rinks, error } = await supabase
    .from("rinks")
    .select("id, name_ko, name_en, is_approved, map_url")
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

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Unauthorized" };
  }

  const rinkId = formData.get("rink_id") as string;
  const clubId = formData.get("club_id") as string;

  if (clubId && profile?.role !== "superuser") {
    const { data: manageableMembership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!manageableMembership) {
      return { error: "해당 동호회 경기를 생성할 권한이 없습니다." };
    }
  }

  const startTimeInput = formData.get("start_time") as string;
  const matchType = (formData.get("match_type") as "training" | "game" | "team_match") || "training";
  const isTeamMatch = matchType === "team_match";
  const isTraining = matchType === "training";

  // 팀 매치: 금액/인원 관련 필드 모두 명시적으로 0/false/null 세팅
  const entryPointsStr = (formData.get("entry_points") as string)?.replace(/,/g, "");
  const entryPoints = isTeamMatch ? 0 : (entryPointsStr ? parseInt(entryPointsStr) : 0);

  if (!isTeamMatch && entryPoints > MAX_MATCH_ENTRY_POINTS) {
    return { error: MATCH_ENTRY_LIMIT_ERROR_KO };
  }

  const rentalFeeStr = (formData.get("rental_fee") as string)?.replace(/,/g, "");
  const rentalFee = isTeamMatch ? 0 : (rentalFeeStr ? parseInt(rentalFeeStr) : 0);

  // 훈련 대관: max_guests로 게스트 인원 관리
  const maxGuestsInput = formData.get("max_guests") as string;
  const maxGuestsParsed = maxGuestsInput ? parseInt(maxGuestsInput) : NaN;
  const maxGuests = isTraining ? (isNaN(maxGuestsParsed) ? null : maxGuestsParsed) : null;

  const skatersInput = formData.get("max_skaters") as string;
  const skatersParsed = parseInt(skatersInput);
  // 팀 매치: 상대팀 대표 1명만 신청 가능
  // 훈련 대관: max_guests 값으로 max_skaters 동기화 (무제한이면 999)
  const maxSkaters = isTeamMatch ? 1 : isTraining ? (maxGuests ?? 999) : (isNaN(skatersParsed) ? 20 : skatersParsed);

  const goaliesInput = formData.get("max_goalies") as string;
  const goaliesParsed = parseInt(goaliesInput);
  const maxGoalies = (isTeamMatch || isTraining) ? 0 : (isNaN(goaliesParsed) ? 2 : goaliesParsed);
  const description = formData.get("description") as string;
  const bankAccount = isTeamMatch ? null : (formData.get("bank_account") as string);
  const goalieFree = (isTeamMatch || isTraining) ? false : formData.get("goalie_free") === "true";
  const rentalAvailable = isTeamMatch ? false : formData.get("rental_available") === "true";

  const durationInput = formData.get("duration_minutes") as string;
  const durationParsed = durationInput ? parseInt(durationInput) : NaN;
  const durationMinutes = isNaN(durationParsed) ? null : durationParsed;

  // datetime-local 입력은 KST로 가정, UTC로 변환하여 저장
  // 입력: "2026-01-11T00:00" (KST) → 저장: "2026-01-10T15:00:00.000Z" (UTC)
  const startTimeUTC = new Date(startTimeInput + "+09:00").toISOString();

  const { data, error } = await supabase
    .from("matches")
    .insert({
      rink_id: rinkId || null,
      club_id: clubId || null,
      start_time: startTimeUTC,
      fee: entryPoints, // Keep fee for backward compatibility
      entry_points: entryPoints,
      rental_fee: rentalFee,
      rental_available: rentalAvailable,
      max_skaters: maxSkaters,
      max_goalies: maxGoalies,
      description: description || null,
      status: "open",
      created_by: user.id,
      bank_account: bankAccount || null,
      goalie_free: goalieFree,
      match_type: matchType,
      max_guests: maxGuests,
      duration_minutes: durationMinutes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");

  // Fetch Club Name (if clubId exists)
  let clubName = "";
  if (clubId) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("name")
      .eq("id", clubId)
      .single();
    if (clubData) clubName = clubData.name;
  }

  // Fetch User Name
  const creatorName = profile?.full_name || user.email?.split("@")[0] || "관리자";
  const teamInfo = clubName ? `[${clubName}] ` : "";

  // Audit Log & SuperUser Notification
  await logAndNotify({
    userId: user.id,
    action: "MATCH_CREATE",
    description: `${teamInfo}매치를 생성했습니다. (일시: ${startTimeInput})`,
    metadata: { matchId: data.id, rinkId, startTime: startTimeInput, clubId, creatorName },
  });

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

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Unauthorized" };
  }

  const rinkId = formData.get("rink_id") as string;
  const clubId = formData.get("club_id") as string;

  if (clubId && profile?.role !== "superuser") {
    const { data: manageableMembership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!manageableMembership) {
      return { error: "해당 동호회 경기를 수정할 권한이 없습니다." };
    }
  }

  const startTimeInput = formData.get("start_time") as string;
  const matchType = (formData.get("match_type") as "training" | "game" | "team_match") || "training";
  const isTeamMatch = matchType === "team_match";
  const isTraining = matchType === "training";

  const fee = isTeamMatch ? 0 : (parseInt((formData.get("fee") as string)?.replace(/,/g, "")) || 0);
  const rentalFee = isTeamMatch ? 0 : (parseInt((formData.get("rental_fee") as string)?.replace(/,/g, "")) || 0);

  if (!isTeamMatch && fee > MAX_MATCH_ENTRY_POINTS) {
    return { error: MATCH_ENTRY_LIMIT_ERROR_KO };
  }

  // 훈련 대관: max_guests로 게스트 인원 관리
  const maxGuestsInput = formData.get("max_guests") as string;
  const maxGuestsParsed = maxGuestsInput ? parseInt(maxGuestsInput) : NaN;
  const maxGuests = isTraining ? (isNaN(maxGuestsParsed) ? null : maxGuestsParsed) : null;

  const skatersInput = formData.get("max_skaters") as string;
  const skatersParsed = parseInt(skatersInput);
  const maxSkaters = isTeamMatch ? 1 : isTraining ? (maxGuests ?? 999) : (isNaN(skatersParsed) ? 20 : skatersParsed);

  const goaliesInput = formData.get("max_goalies") as string;
  const goaliesParsed = parseInt(goaliesInput);
  const maxGoalies = (isTeamMatch || isTraining) ? 0 : (isNaN(goaliesParsed) ? 2 : goaliesParsed);
  const description = formData.get("description") as string;
  const bankAccount = isTeamMatch ? null : (formData.get("bank_account") as string);
  const status = formData.get("status") as string;
  const goalieFree = (isTeamMatch || isTraining) ? false : formData.get("goalie_free") === "true";
  const rentalAvailable = isTeamMatch ? false : formData.get("rental_available") === "true";

  const durationInput = formData.get("duration_minutes") as string;
  const durationParsed = durationInput ? parseInt(durationInput) : NaN;
  const durationMinutes = isNaN(durationParsed) ? null : durationParsed;

  // datetime-local 입력은 KST로 가정, UTC로 변환하여 저장
  const startTimeUTC = new Date(startTimeInput + "+09:00").toISOString();

  const { error } = await supabase
    .from("matches")
    .update({
      rink_id: rinkId || null,
      club_id: clubId || null,
      start_time: startTimeUTC,
      fee,
      entry_points: fee,
      rental_fee: rentalFee,
      rental_available: rentalAvailable,
      max_skaters: maxSkaters,
      max_goalies: maxGoalies,
      description: description || null,
      bank_account: bankAccount || null,
      status: status as "open" | "closed" | "canceled" | "finished",
      goalie_free: goalieFree,
      match_type: matchType,
      max_guests: maxGuests,
      duration_minutes: durationMinutes,
    })
    .eq("id", matchId);

  if (error) {
    console.error("Error updating match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}/edit`);
  // 알림 발송 및 환불 처리 (Trigger 5: 경기 취소)
  if (status === "canceled") {
    // 1. Get all participants with status
    const { data: participants } = await supabase
      .from("participants")
      .select("user_id, status, rental_opt_in")
      .eq("match_id", matchId)
      .in("status", ["applied", "confirmed", "pending_payment"]);

    if (participants && participants.length > 0) {
      // 2. Fetch match info for refund amount
      const { data: currentMatch } = await supabase
        .from("matches")
        .select("entry_points, rental_fee, start_time, rink:rinks(name_ko)")
        .eq("id", matchId)
        .single();

      if (currentMatch) {
        // @ts-ignore
        const rinkName = currentMatch.rink?.name_ko || "경기";
        const startTime = new Date(currentMatch.start_time).toLocaleString("ko-KR", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          timeZone: "Asia/Seoul"
        });

        await Promise.allSettled(
          participants.map(async (p) => {
            // A. Refund Logic (Only for confirmed users)
            if (p.status === "confirmed" && currentMatch.entry_points > 0) {
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("points")
                .eq("id", p.user_id)
                .single();

              if (userProfile) {
                // Determine refund amount: entry_points + rental_fee if opted in
                const isRentalOptIn = p.rental_opt_in === true;
                const rentalFee = isRentalOptIn ? (currentMatch.rental_fee || 0) : 0;
                const refundAmount = currentMatch.entry_points + rentalFee;

                const newBalance = (userProfile.points || 0) + refundAmount;

                // Update Balance
                await supabase
                  .from("profiles")
                  .update({ points: newBalance })
                  .eq("id", p.user_id);

                // Log Transaction
                await supabase.from("point_transactions").insert({
                  user_id: p.user_id,
                  type: "refund",
                  amount: refundAmount,
                  balance_after: newBalance,
                  description: "관리자 취소 환불 (100%)",
                  reference_id: matchId,
                });
              }
            }

            // B. Send Notification
            return sendPushNotification(
              p.user_id,
              "경기 취소 알림 🚫",
              `관리자 사정으로 ${rinkName} (${startTime}) 경기가 취소되었습니다. (확정자는 전액 환불)`,
              `/mypage`
            );
          })
        );
      }
    }
  }

  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}/edit`);
  return { success: true };
}

// Toggle participant payment status


// Cancel a match by admin (Safe cancellation with refunds)
export async function cancelMatchByAdmin(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Unauthorized" };
  }

  // 1. Get Match Info & Participants
  const { data: match } = await supabase
    .from("matches")
    .select("start_time, entry_points, rental_fee, rink:rinks(name_ko)")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("user_id, status, rental_opt_in")
    .eq("match_id", matchId);

  if (participantsError) {
    return { error: "Failed to fetch participants: " + participantsError.message };
  }

  if (!participants) return { success: true };

  // 2. Process Refunds & Notifications
  const refundPromises = participants.map(async (p) => {
    // Refund only confirmed participants with payment
    // We treat admin cancellation as 100% refund regardless of time
    if (p.status === "confirmed" && match.entry_points > 0) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", p.user_id)
        .single();

      if (userProfile) {
        // Determine refund amount: entry_points + rental_fee if opted in
        const isRentalOptIn = p.rental_opt_in === true;
        const rentalFee = isRentalOptIn ? (match.rental_fee || 0) : 0;
        const refundAmount = match.entry_points + rentalFee;

        const newBalance = (userProfile.points || 0) + refundAmount;

        // Update Balance
        await supabase
          .from("profiles")
          .update({ points: newBalance })
          .eq("id", p.user_id);

        // Log Transaction
        await supabase.from("point_transactions").insert({
          user_id: p.user_id,
          type: "refund",
          amount: refundAmount,
          balance_after: newBalance,
          description: "관리자 취소 환불 (100%)",
          reference_id: matchId,
        });
      }
    }

    // Send Notification to ALL participants
    // @ts-ignore
    const rinkName = match.rink?.name_ko || "경기";
    const startTime = new Date(match.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });

    return sendPushNotification(
      p.user_id,
      "경기 취소 알림 📢",
      `관리자 사정으로 ${rinkName} (${startTime}) 경기가 취소되었습니다. (확정자는 전액 환불)`,
      "/mypage" // Redirect to mypage or points history
    );
  });

  await Promise.all(refundPromises);

  // 3. Update Match Status
  const { data: updatedMatch, error } = await supabase
    .from("matches")
    .update({ status: "canceled" })
    .eq("id", matchId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (!updatedMatch) {
    return { error: "Failed to update match status. Check permissions." };
  }

  revalidatePath("/admin/matches");
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

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Unauthorized" };
  }

  // SAFETY GUARD: Check for participants
  const { count } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId);

  if (count && count > 0) {
    return { error: "참가자가 있는 경기는 삭제할 수 없습니다. 대신 '경기 취소'를 이용해주세요." };
  }

  // Pre-fetch match info for notification
  const { data: matchToDelete } = await supabase
    .from("matches")
    .select("start_time, rink:rinks(name_ko), club:clubs(name)")
    .eq("id", matchId)
    .single();

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    console.error("Error deleting match:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");

  if (matchToDelete) {
    // @ts-ignore
    const rinkName = matchToDelete.rink?.name_ko || "경기장 미정";
    // @ts-ignore
    const clubName = matchToDelete.club?.name || "";
    const teamInfo = clubName ? `[${clubName}] ` : "";
    const startTime = new Date(matchToDelete.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });

    const creatorName = profile?.full_name || user.email?.split("@")[0] || "관리자";

    // Audit Log & SuperUser Notification
    await logAndNotify({
      userId: user.id,
      action: "MATCH_DELETE",
      description: `${teamInfo}${rinkName} (${startTime}) 매치를 삭제했습니다.`,
      metadata: { matchId, rinkName, startTime, creatorName },
    });
  }

  return { success: true };
}

// ==================== BULK MATCH CREATION ====================

export interface BulkMatchInput {
  rink_id: string;
  club_id?: string;
  start_time: string; // KST datetime string e.g. "2026-03-04T22:00"
  duration_minutes: number | null;
  match_type: "game" | "training" | "team_match";
  entry_points: number;
  bank_account: string | null;
  max_skaters: number;
  max_goalies: number;
  max_guests: number | null;
  goalie_free: boolean;
  rental_available: boolean;
  rental_fee: number;
  description: string | null;
}

// Create multiple matches at once
export async function createBulkMatches(
  matches: BulkMatchInput[],
  clubId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return { error: "Unauthorized" };
  }

  if (matches.length === 0) {
    return { error: "No matches to create" };
  }

  if (clubId && profile?.role !== "superuser") {
    const { data: manageableMembership } = await supabase
      .from("club_memberships")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!manageableMembership) {
      return { error: "해당 동호회 경기를 생성할 권한이 없습니다." };
    }
  }

  const hasEntryPointsOverLimit = matches.some(
    (match) => match.match_type !== "team_match" && match.entry_points > MAX_MATCH_ENTRY_POINTS
  );

  if (hasEntryPointsOverLimit) {
    return { error: MATCH_ENTRY_LIMIT_ERROR_KO };
  }

  // Build insert rows
  const insertRows = matches.map((m) => {
    // Convert KST to UTC
    const startTimeUTC = new Date(m.start_time + "+09:00").toISOString();

    return {
      rink_id: m.rink_id || null,
      club_id: clubId || null,
      start_time: startTimeUTC,
      fee: m.entry_points,
      entry_points: m.entry_points,
      rental_fee: m.rental_fee,
      rental_available: m.rental_available,
      max_skaters: m.max_skaters,
      max_goalies: m.max_goalies,
      description: m.description || null,
      status: "open" as const,
      created_by: user.id,
      bank_account: m.bank_account || null,
      goalie_free: m.goalie_free,
      match_type: m.match_type,
      max_guests: m.max_guests,
      duration_minutes: m.duration_minutes,
    };
  });

  const { data, error } = await supabase
    .from("matches")
    .insert(insertRows)
    .select("id");

  if (error) {
    console.error("Error creating bulk matches:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/matches");

  // Fetch club name for audit log
  let clubName = "";
  if (clubId) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("name")
      .eq("id", clubId)
      .single();
    if (clubData) clubName = clubData.name;
  }

  const creatorName =
    profile?.full_name || user.email?.split("@")[0] || "관리자";
  const teamInfo = clubName ? `[${clubName}] ` : "";

  await logAndNotify({
    userId: user.id,
    action: "MATCH_CREATE",
    description: `${teamInfo}${matches.length}개의 매치를 일괄 생성했습니다.`,
    metadata: {
      matchIds: data?.map((d) => d.id),
      count: matches.length,
      clubId,
      creatorName,
    },
  });

  return { success: true, count: data?.length || 0 };
}

// Get previous month's matches for "copy from last month" feature
export async function getPreviousMonthMatches(
  targetYear: number,
  targetMonth: number
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return [];
  }

  // Calculate previous month range
  const prevDate = new Date(targetYear, targetMonth - 2, 1); // month is 0-based, -2 to go back one month
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth(); // 0-based

  const startOfMonth = new Date(
    Date.UTC(prevYear, prevMonth, 1) - 9 * 60 * 60 * 1000
  ); // KST midnight → UTC
  const endOfMonth = new Date(
    Date.UTC(prevYear, prevMonth + 1, 1) - 9 * 60 * 60 * 1000
  );

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      rink_id,
      start_time,
      duration_minutes,
      match_type,
      entry_points,
      rental_fee,
      rental_available,
      bank_account,
      max_skaters,
      max_goalies,
      max_guests,
      goalie_free,
      description
    `
    )
    .eq("created_by", user.id)
    .gte("start_time", startOfMonth.toISOString())
    .lt("start_time", endOfMonth.toISOString())
    .neq("status", "canceled")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching previous month matches:", error);
    return [];
  }

  return matches || [];
}


export async function getAdminMatches() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
    return [];
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      start_time,
      duration_minutes,
      fee,
      entry_points,
      match_type,
      max_skaters,
      max_goalies,
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
  const expiredParticipantIds: string[] = [];
  const now = new Date();

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
          rental_opt_in,
          team_color,
          user:user_id(id, full_name, email, phone)
        `
        )
        .eq("match_id", match.id)
        .order("created_at", { ascending: true });

      // Check for expired pending payments
      const isExpired = new Date(match.start_time) < now;

      const processedParticipants = (participants || []).map((p) => {
        if (isExpired && p.status === "pending_payment") {
          expiredParticipantIds.push(p.id);
          // Return as canceled for UI
          return { ...p, status: "canceled" };
        }
        return p;
      });

      // Calculate counts using processed participants
      const counts = {
        fw: processedParticipants.filter((p) => p.position === "FW" && ["applied", "confirmed"].includes(p.status)).length || 0,
        df: processedParticipants.filter((p) => p.position === "DF" && ["applied", "confirmed"].includes(p.status)).length || 0,
        g: processedParticipants.filter((p) => p.position === "G" && ["applied", "confirmed"].includes(p.status)).length || 0,
      };

      // Transform participants similar to getMatch
      const transformedParticipants = processedParticipants.map((p) => {
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

  // Lazy Expiration: Cancel expired pending matches
  if (expiredParticipantIds.length > 0) {
    await supabase
      .from("participants")
      .update({ status: "canceled" })
      .in("id", expiredParticipantIds);

    console.log(`[LazyExpiration:Admin] Canceled ${expiredParticipantIds.length} expired pending applications.`);
  }

  return matchesWithParticipants;
}

// ==================== RINK CRUD ====================

// Parse Naver Map URL to extract coordinates and place info
export async function parseNaverMapUrl(url: string): Promise<{
  success: boolean;
  data?: {
    lat: number;
    lng: number;
    address: string;
    mapUrl: string;
    name?: string; // Place name if available
  };
  error?: string;
}> {
  try {
    if (!isAllowedNaverMapUrl(url)) {
      return {
        success: false,
        error: "naver.me 또는 map.naver.com URL만 허용됩니다.",
      };
    }

    // Follow redirects to get the full URL
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    const finalUrl = response.url;
    if (!isAllowedNaverMapUrl(finalUrl)) {
      return {
        success: false,
        error: "허용되지 않은 지도 URL입니다.",
      };
    }
    const urlObj = new URL(finalUrl);

    // Try to extract lat and lng from URL params first
    let latitude = urlObj.searchParams.get("lat") ? parseFloat(urlObj.searchParams.get("lat")!) : null;
    let longitude = urlObj.searchParams.get("lng") ? parseFloat(urlObj.searchParams.get("lng")!) : null;
    let placeName = "";
    let address = "";

    // If lat/lng not in params, try to extract Place ID and use Naver Place API
    if (!latitude || !longitude) {
      // Extract place ID from URL path (e.g., /place/1450992971 or /entry/place/1450992971)
      const placeIdMatch = finalUrl.match(/\/place\/(\d+)/);

      if (placeIdMatch) {
        const placeId = placeIdMatch[1];

        try {
          // Call Naver Place Summary API
          const placeResponse = await fetch(
            `https://map.naver.com/p/api/place/summary/${placeId}`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Referer": "https://map.naver.com/",
              },
            }
          );

          if (placeResponse.ok) {
            const placeData = await placeResponse.json();
            const detail = placeData?.data?.placeDetail;

            if (detail) {
              // Extract coordinates
              if (detail.coordinate) {
                latitude = detail.coordinate.latitude;
                longitude = detail.coordinate.longitude;
              }

              // Extract name
              if (detail.name) {
                placeName = detail.name;
              }

              // Extract address (prefer road address)
              if (detail.address) {
                address = detail.address.roadAddress || detail.address.address || "";
              }
            }
          }
        } catch (placeError) {
          console.error("Naver Place API failed:", placeError);
        }
      }
    }

    // Final validation
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: "좌표를 추출할 수 없습니다. 올바른 네이버 지도 URL인지 확인해주세요."
      };
    }

    // If we still don't have an address and we have coords, try reverse geocoding
    if (!address && latitude && longitude) {
      const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
      const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

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
            const results = geocodeData.results;
            if (results && results.length > 0) {
              const result = results[0];
              const region = result.region;
              const land = result.land;

              if (result.name === "roadaddr" && land) {
                address = `${region.area1.name} ${region.area2.name} ${region.area3.name} ${land.name} ${land.number1}${land.number2 ? "-" + land.number2 : ""}`;
              } else if (region) {
                address = `${region.area1.name} ${region.area2.name} ${region.area3.name}${region.area4?.name ? " " + region.area4.name : ""}`;
              }
            }
          }
        } catch (geocodeError) {
          console.error("Reverse geocoding failed:", geocodeError);
        }
      }
    }

    return {
      success: true,
      data: {
        lat: latitude,
        lng: longitude,
        address: address.trim(),
        mapUrl: url,
        name: placeName || undefined,
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

  // Verify admin or superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "superuser") {
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

  const isApproved = profile?.role === "superuser";

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
      is_approved: isApproved,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating rink:", error);
    return { error: error.message };
  }

  // Audit Log (Background)
  await logAndNotify({
    userId: user.id,
    action: "OTHER",
    description: isApproved 
      ? `슈퍼유저 ${user.email}님이 새 링크장 '${nameKo}'를 생성했습니다.`
      : `${user.email}님이 새 링크장 '${nameKo}' 승인을 요청했습니다. (승인 대기 중)`,
    metadata: { rinkId: data.id, nameKo, isApproved },
  });

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

  // Verify superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { error: "Unauthorized. Superuser required to edit rinks." };
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

// Approve a rink
export async function approveRink(rinkId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { error: "Unauthorized. Superuser required to approve rinks." };
  }

  // 1. Get the original creator's user ID before approving
  const { data: rink } = await supabase
    .from("rinks")
    .select("created_by, name_ko")
    .eq("id", rinkId)
    .single();

  const { error } = await supabase
    .from("rinks")
    .update({
      is_approved: true,
    })
    .eq("id", rinkId);

  if (error) {
    console.error("Error approving rink:", error);
    return { error: error.message };
  }

  // Audit Log and Notification
  if (rink) {
    await logAndNotify({
      userId: user.id,
      action: "OTHER",
      description: `슈퍼유저가 링크장 '${rink.name_ko}' 승인을 완료했습니다.`,
      metadata: { rinkId, nameKo: rink.name_ko },
      skipPush: true, // Don't notify superusers about superuser action
    });

    if (rink.created_by) {
      await sendPushNotification(
        rink.created_by,
        "링크장 승인 완료 🏟️",
        `요청하신 '${rink.name_ko}' 링크장의 승인이 완료되었습니다.`,
        "/admin/rinks"
      );
    }
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

  // Verify superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { error: RINK_DELETE_UNAUTHORIZED_ERROR };
  }

  const snapshot = await getRinkDeleteImpactSnapshot(supabase, rinkId);
  if ("error" in snapshot) {
    return { error: snapshot.error };
  }

  const { error } = await supabase.from("rinks").delete().eq("id", rinkId);

  if (error) {
    console.error("Error deleting rink:", error);
    return { error: error.message };
  }

  revalidateRinkPaths(rinkId);

  await logAndNotify({
    userId: user.id,
    action: "RINK_DELETE",
    description: `링크장 '${snapshot.rink.name_ko}'를 삭제했습니다.`,
    metadata: { ...snapshot.impact },
    skipPush: true,
    url: "/ko/admin/rinks",
  });

  return { success: true };
}

export async function getRinkDeleteImpact(rinkId: string): Promise<{
  success: boolean;
  impact?: RinkDeleteImpact;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return { success: false, error: RINK_DELETE_UNAUTHORIZED_ERROR };
  }

  const snapshot = await getRinkDeleteImpactSnapshot(supabase, rinkId);
  if ("error" in snapshot) {
    return { success: false, error: snapshot.error };
  }

  return { success: true, impact: snapshot.impact };
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

// ==================== ADMIN MANAGEMENT (SuperUser Only) ====================

// Get all admins
export async function getAdmins() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify superuser role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    return [];
  }

  // Fetch all profiles with role 'admin'
  const { data: admins, error } = await supabase
    .from("profiles")
    .select(`
      *,
      club_memberships (
        club:clubs (name)
      )
    `)
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admins:", error);
    return [];
  }

  return admins || [];
}

interface AdminClub {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  role: string | null;
  joined_at: string;
}

interface AdminMatch {
  id: string;
  start_time: string;
  status: "open" | "closed" | "canceled";
  rink: {
    name_ko: string;
  } | null;
}

interface AdminLoungeBusiness {
  id: string;
  category: LoungeBusinessCategory;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

// Get admin detail (clubs and matches)
export async function getAdminDetail(targetUserId: string): Promise<{
  profile: any;
  clubs: AdminClub[];
  matches: AdminMatch[];
  loungeBusiness: AdminLoungeBusiness | null;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Verify superuser role
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "superuser") {
    return null;
  }

  // 1. Get Target User Profile
  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetUserId)
    .single();

  if (profileError || !targetProfile) {
    console.error("Error fetching admin profile:", profileError);
    return null;
  }

  // 2. Get Clubs they belong to
  const { data: clubMemberships, error: clubError } = await supabase
    .from("club_memberships")
    .select(`
      club_id,
      role,
      created_at,
      club:clubs (
        id,
        name,
        logo_url,
        description
      )
    `)
    .eq("user_id", targetUserId);

  if (clubError) {
    console.error("Error fetching admin clubs:", clubError);
  }

  // 3. Get Matches they created
  const [hostedMatchesResult, loungeBusinessResult] = await Promise.all([
    supabase
      .from("matches")
      .select(`
        id,
        start_time,
        status,
        rink:rinks (name_ko)
      `)
      .eq("created_by", targetUserId)
      .order("start_time", { ascending: false }),
    supabase
      .from("lounge_businesses")
      .select("id, category, name, slug, tagline, description, is_published, created_at")
      .eq("owner_user_id", targetUserId)
      .maybeSingle(),
  ]);

  const hostedMatches = hostedMatchesResult.data;
  const matchError = hostedMatchesResult.error;
  const loungeBusinessError = loungeBusinessResult.error;

  if (matchError) {
    console.error("Error fetching admin matches:", matchError);
  }

  if (loungeBusinessError) {
    console.error("Error fetching admin lounge business:", loungeBusinessError);
  }

  return {
    profile: targetProfile,
    clubs: (clubMemberships || []).map((m) => {
      // @ts-ignore
      const club = Array.isArray(m.club) ? m.club[0] : m.club;
      return {
        id: club?.id,
        name: club?.name,
        logo_url: club?.logo_url,
        description: club?.description,
        role: m.role,
        joined_at: m.created_at,
      };
    }) as AdminClub[],
    matches: (hostedMatches || []).map((match) => ({
      ...match,
      rink: Array.isArray(match.rink) ? match.rink[0] : match.rink,
    })) as AdminMatch[],
    loungeBusiness: (loungeBusinessResult.data as AdminLoungeBusiness | null) ?? null,
  };
}

// Get detailed profile of a participant (for Admin/Superuser)
export async function getParticipantProfile(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Verify admin or superuser role
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin" && myProfile?.role !== "superuser") {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      phone,
      bio,
      hockey_start_date,
      primary_club_id,
      stick_direction,
      detailed_positions,
      club:clubs!primary_club_id(name)
    `)
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error("Error fetching participant profile:", error);
    return null;
  }

  const clubObj = profile.club as any;
  const clubName = Array.isArray(clubObj) ? clubObj[0]?.name : clubObj?.name;

  return {
    ...profile,
    club_name: clubName || null,
  };
}
