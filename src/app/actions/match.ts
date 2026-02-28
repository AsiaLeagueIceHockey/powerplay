"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateRefundPercent } from "./points";
import { sendPushNotification } from "@/app/actions/push";
import { logAndNotify } from "@/lib/audit";

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
  status: "applied" | "confirmed" | "pending_payment" | "waiting" | "canceled";
  payment_status: boolean;
  rental_opt_in: boolean; // Added for Equipment Rental
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
  rental_fee: number; // Added for Equipment Rental
  rental_available: boolean; // Added for Equipment Rental
  match_type: "training" | "game" | "team_match";
  max_skaters: number;
  max_goalies: number;
  status: "open" | "closed" | "canceled" | "finished";
  description?: string;
  bank_account?: string;
  goalie_free?: boolean;
  max_guests?: number | null;
  created_by?: string;
  rink: MatchRink | null;
  club: MatchClub | null;
  participants?: MatchParticipant[];
  participants_count?: { fw: number; df: number; g: number };
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
      rental_fee,
      rental_available,
      match_type,
      max_guests,
      max_skaters,
      max_goalies,
      status,
      description,
      rink:rink_id(id, name_ko, name_en, address, lat, lng, rink_type),
      club:club_id(id, name, kakao_open_chat_url, logo_url)
    `
    )
    .neq("status", "canceled")
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
      rental_fee,
      rental_available,
      match_type,
      max_guests,
      max_skaters,
      max_goalies,
      status,
      description,
      bank_account,
      goalie_free,
      created_by,
      rink:rink_id(id, name_ko, name_en, map_url, address, lat, lng),
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
      rental_opt_in,
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

export async function joinMatch(
  matchId: string,
  position: string,
  options?: { rental?: boolean }
): Promise<{
  success?: boolean;
  error?: string;
  code?: string;
  status?: 'confirmed' | 'pending_payment';
}> {
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

  // Get match entry_points, rental_fee, and goalie_free setting
  const { data: match } = await supabase
    .from("matches")
    .select("entry_points, rental_fee, status, goalie_free, rental_available, match_type")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  if (match.status !== "open") {
    return { error: "Match is not open for registration" };
  }

  // 골리이고 goalie_free가 true면 무료
  const isGoalieAndFree = position === "G" && match.goalie_free === true;
  const baseEntryPoints = isGoalieAndFree ? 0 : (match.entry_points || 0);
  
  // Calculate Rental Fee
  const isRentalOptIn = options?.rental === true;
  
  // Validate Rental Availability
  if (isRentalOptIn && !match.rental_available) {
    return { error: "Equipment rental is not available for this match" };
  }

  const rentalFee = isRentalOptIn ? (match.rental_fee || 0) : 0;
  
  // Total Points Needed
  const totalPoints = baseEntryPoints + rentalFee;

  // Get user's current points
  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const userPoints = profile?.points || 0;
  const hasEnoughPoints = totalPoints === 0 || userPoints >= totalPoints;

  // Determine status based on points
  // confirmed: 포인트 충분하면 즉시 확정 + 차감
  // pending_payment: 포인트 부족하면 입금 대기 상태
  const participantStatus = hasEnoughPoints ? "confirmed" : "pending_payment";

  // Deduct points only if confirmed and totalPoints > 0
  if (hasEnoughPoints && totalPoints > 0) {
    const newBalance = userPoints - totalPoints;

    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ points: newBalance })
      .eq("id", user.id);

    if (pointsError) {
      return { error: "Failed to deduct points" };
    }

    // Record transaction
    // Description varies by match type
    const isTrainingTransaction = match.match_type === "training";
    const desc = isTrainingTransaction
      ? (isRentalOptIn ? "게스트 참가 (장비 대여 포함)" : "게스트 참가")
      : (isRentalOptIn ? "경기 참가 (장비 대여 포함)" : "경기 참가");
    
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      type: "use",
      amount: -totalPoints,
      balance_after: newBalance,
      description: desc,
      reference_id: matchId,
    });
  }

  const { error } = await supabase.from("participants").insert({
    match_id: matchId,
    user_id: user.id,
    position: position,
    status: participantStatus,
    payment_status: hasEnoughPoints,
    rental_opt_in: isRentalOptIn,
  });

  if (error) {
    // Rollback points if participant insert failed and we deducted
    if (hasEnoughPoints && totalPoints > 0) {
      await supabase
        .from("profiles")
        .update({ points: userPoints })
        .eq("id", user.id);
    }
    return { error: error.message };
  }



  // 알림 발송 (Trigger 3: 참가 확정)
  // Get match details for notifications
  const { data: matchDetails } = await supabase
    .from("matches")
    .select("start_time, created_by, rink:rinks(name_ko)")
    .eq("id", matchId)
    .single();

  // @ts-ignore
  const rinkName = matchDetails?.rink?.name_ko || "경기";
  // @ts-ignore
  const startTime = new Date(matchDetails?.start_time).toLocaleString("ko-KR", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Seoul"
  });

  // Get participant's name for admin notification
  const { data: participantProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const participantName = participantProfile?.full_name || user.email?.split("@")[0] || "참가자";

  // Get match type for notification context
  const { data: matchForType } = await supabase
    .from("matches")
    .select("match_type")
    .eq("id", matchId)
    .single();
   const isTeamMatchNotif = matchForType?.match_type === "team_match";
  const isTrainingNotif = matchForType?.match_type === "training";

  if (participantStatus === "confirmed") {
    const notificationTitle = isTeamMatchNotif ? "팀 매칭 확정 🤝" : isTrainingNotif ? "게스트 참가 확정 🏒" : "경기 참가 확정 🏒";
    const notificationBody = isTeamMatchNotif
      ? `${rinkName} (${startTime}) 팀 매칭이 확정되었습니다.`
      : isTrainingNotif
        ? (totalPoints > 0
          ? `${rinkName} (${startTime}) 게스트 참가가 확정되었습니다. (${totalPoints.toLocaleString()}원 차감)`
          : `${rinkName} (${startTime}) 게스트 참가 신청이 완료되었습니다.`)
        : totalPoints > 0
          ? `${rinkName} (${startTime}) 참가가 확정되었습니다. (${totalPoints.toLocaleString()}원 차감)`
          : `${rinkName} (${startTime}) 참가 신청이 완료되었습니다.`;

    await sendPushNotification(
      user.id,
      notificationTitle,
      notificationBody,
      `/match/${matchId}`
    );
  }

  // 알림 발송: 경기 생성자(어드민)에게 새 참가자 알림
  if (matchDetails?.created_by && matchDetails.created_by !== user.id) {
    const adminMsg = isTeamMatchNotif
      ? `${participantName}님이 ${rinkName} (${startTime}) 팀 매칭에 상대팀으로 신청했습니다.`
      : isTrainingNotif
        ? (isRentalOptIn
          ? `${participantName}님이 ${rinkName} (${startTime}) 훈련에 게스트로 신청했습니다. (장비대여)`
          : `${participantName}님이 ${rinkName} (${startTime}) 훈련에 게스트로 신청했습니다.`)
        : isRentalOptIn 
          ? `${participantName}님이 ${rinkName} (${startTime}) 경기에 신청했습니다. (장비대여)`
          : `${participantName}님이 ${rinkName} (${startTime}) 경기에 신청했습니다.`;
    const adminTitle = isTeamMatchNotif ? "상대팀 매칭 신청 🤝" : isTrainingNotif ? "새 게스트 🏒" : "새 참가자 🏒";

    await sendPushNotification(
      matchDetails.created_by,
      adminTitle,
      adminMsg,
      `/admin/matches`
    );
  }

  // Audit Log
  const auditMatchLabel = isTrainingNotif ? "훈련" : "경기";
  const auditJoinLabel = isTrainingNotif
    ? (participantStatus === "confirmed" ? "게스트로 참가 확정" : "게스트로 참가 신청(입금대기)")
    : (participantStatus === "confirmed" ? "참가 확정" : "참가 신청(입금대기)");
  await logAndNotify({
    userId: user.id,
    action: "MATCH_JOIN",
    description: `${participantName}님이 ${rinkName} ${auditMatchLabel}에 ${auditJoinLabel}했습니다. ${isRentalOptIn ? "(장비대여)" : ""}`,
    metadata: { matchId, rinkName, status: participantStatus, amount: totalPoints, rental: isRentalOptIn },
  });

  return { success: true, status: participantStatus };
}

export async function cancelJoin(matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if user is a participant and get status AND position AND rental_opt_in
  const { data: participant } = await supabase
    .from("participants")
    .select("id, status, position, rental_opt_in")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { error: "Not a participant" };
  }

  const isPendingPayment = participant.status === "pending_payment";
  const isWaiting = participant.status === "waiting";
  const isRentalOptIn = participant.rental_opt_in === true;

  // Get match info for refund calculation including goalie_free and rental_fee
  const { data: match } = await supabase
    .from("matches")
    .select("entry_points, rental_fee, start_time, goalie_free, status")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  // 🚨 경기가 이미 취소된 경우, 사용자 취소(및 환불)를 차단 — 이중 환불 방지
  if (match.status === "canceled") {
    // 참가 기록만 삭제하고, 환불은 하지 않음 (이미 관리자 취소 시 환불됨)
    await supabase
      .from("participants")
      .delete()
      .eq("match_id", matchId)
      .eq("user_id", user.id);
    return { success: true, refundAmount: 0 };
  }

  // 골리이고 goalie_free가 true면 참가비는 0원 처리
  const isGoalieAndFree = participant.position === "G" && match.goalie_free === true;
  const baseEntryPoints = isGoalieAndFree ? 0 : (match.entry_points || 0);
  
  // Calculate Total Paid
  const rentalFee = isRentalOptIn ? (match.rental_fee || 0) : 0;
  const totalPaid = baseEntryPoints + rentalFee;

  let refundAmount = 0;

  // Calculate refund based on policy
  // Refund only if:
  // 1. Not pending payment (haven't paid yet)
  // 2. Not waiting (waitlist doesn't pay upfront)
  // 3. User paid something (totalPaid > 0)
  if (!isPendingPayment && !isWaiting && totalPaid > 0) {
    const refundPercent = await calculateRefundPercent(match.start_time);
    refundAmount = Math.floor(totalPaid * refundPercent / 100);
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
    // Use totalPaid specifically for the description percentage calculation
    const refundPercentage = totalPaid > 0
      ? Math.floor(refundAmount / totalPaid * 100)
      : 0;

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      type: "refund",
      amount: refundAmount,
      balance_after: newBalance,
      description: `경기 취소 환불 (${refundPercentage}%)`,
      reference_id: matchId,
    });
  }

  // Get match type for notification context
  const { data: matchTypeData } = await supabase
    .from("matches")
    .select("match_type")
    .eq("id", matchId)
    .single();
  const isTeamMatchCancel = matchTypeData?.match_type === "team_match";

  // 알림 발송 (Trigger 4: 참가 취소 및 포인트 반환)
  if (isTeamMatchCancel) {
    // 팀 매치: 간단한 취소 알림 (환불 없음)
    await sendPushNotification(
      user.id,
      "팀 매칭 취소 ↩️",
      `팀 매칭 신청이 취소되었습니다.`,
      `/mypage`
    );
  } else if (refundAmount > 0) {
    await sendPushNotification(
      user.id,
      "환불 완료 💰",
      `경기 취소로 ${refundAmount.toLocaleString()}원이 환불되었습니다.`,
      `/mypage/points`
    );
  } else if (isPendingPayment) {
    await sendPushNotification(
      user.id,
      "신청 취소 완료 ↩️",
      `입금 대기 중이던 경기 신청이 취소되었습니다.`,
      `/mypage`
    );
  } else if (isGoalieAndFree) {
    // 무료 골리 참가 취소
    await sendPushNotification(
      user.id,
      "취소 완료 ↩️",
      `무료로 참가한 경기가 취소되었습니다.`,
      `/mypage`
    );
  } else if (isWaiting) {
    // 대기 취소
    await sendPushNotification(
      user.id,
      "대기 취소 완료 ↩️",
      `대기 신청이 취소되었습니다.`,
      `/mypage`
    );
  } else {
    // 유료 참가자지만 환불 금액이 0원인 경우 (당일 취소 등)
    await sendPushNotification(
      user.id,
      "취소 완료 (환불 불가) ❌",
      `경기 당일 취소로 환불이 불가하며, 신청이 취소되었습니다.`,
      `/mypage`
    );
  }

  // ... (previous notifications)

  // Trigger Waitlist Promotion
  try {
    await promoteWaitlistUser(matchId, participant.position);
  } catch (error) {
    console.error("Failed to promote waitlist user:", error);
  }

  // Audit Log
  await logAndNotify({
    userId: user.id,
    action: "MATCH_CANCEL",
    description: `${user.email}님이 경기 참가를 취소했습니다. (환불: ${refundAmount.toLocaleString()}원)`,
    metadata: { matchId, refundAmount },
  });

  return { success: true, refundAmount };
}

// Helper: Promote the next user on the waitlist
async function promoteWaitlistUser(matchId: string, position: string) {
  const supabase = await createClient();

  // 1. Find oldest waiting user for this position (or skater pool)
  let query = supabase
    .from("participants")
    .select("id, user_id, position, rental_opt_in")
    .eq("match_id", matchId)
    .eq("status", "waiting");

  if (position === "G") {
    query = query.eq("position", "G");
  } else {
    // Treat FW and DF as unified 'Skaters'
    query = query.in("position", ["FW", "DF"]);
  }

  const { data: waiter } = await query
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!waiter) return; // No one waiting

  // 2. Get Match Info & User Points
  const { data: match } = await supabase
    .from("matches")
    .select("entry_points, rental_fee, start_time, goalie_free, rink:rinks(name_ko)")
    .eq("id", matchId)
    .single();

  if (!match) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", waiter.user_id)
    .single();

  const userPoints = profile?.points || 0;

  // Logic: Check Cost
  const isGoalieAndFree = position === "G" && match.goalie_free === true;
  const baseEntryPoints = isGoalieAndFree ? 0 : (match.entry_points || 0);

  // Calculate Rental Fee
  // @ts-ignore
  const isRentalOptIn = waiter.rental_opt_in === true;
  const rentalFee = isRentalOptIn ? (match.rental_fee || 0) : 0;
  
  const totalCost = baseEntryPoints + rentalFee;
  const hasEnoughPoints = totalCost === 0 || userPoints >= totalCost;

  // 3. Process Promotion
  if (hasEnoughPoints) {
    // A. Direct Confirm
    if (totalCost > 0) {
      // Deduct Points
      const newBalance = userPoints - totalCost;
      const { error: pointError } = await supabase
        .from("profiles")
        .update({ points: newBalance })
        .eq("id", waiter.user_id);

      if (pointError) {
        console.error("Waitlist promo point deduction failed", pointError);
        return;
      }

      // Transaction
      const desc = isRentalOptIn ? "대기 승격 및 참가비 결제 (장비 대여 포함)" : "대기 승격 및 참가비 결제";
      await supabase.from("point_transactions").insert({
        user_id: waiter.user_id,
        type: "use",
        amount: -totalCost,
        balance_after: newBalance,
        description: desc,
        reference_id: matchId,
      });
    }

    // Update Status
    await supabase
      .from("participants")
      .update({ status: "confirmed", payment_status: true })
      .eq("id", waiter.id);

    // Notify
    // @ts-ignore
    const rinkName = match.rink?.name_ko || "경기";
    const startTime = new Date(match.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });

    await sendPushNotification(
      waiter.user_id,
      "대기 전환 및 참가 확정 🎉",
      `${rinkName} (${startTime}) 빈자리가 생겨 대기에서 참가로 전환되었습니다! (${totalCost > 0 ? totalCost.toLocaleString() + "원 차감" : "무료"})`,
      `/match/${matchId}`
    );

  } else {
    // B. Pending Payment
    await supabase
      .from("participants")
      .update({ status: "pending_payment", payment_status: false })
      .eq("id", waiter.id);

    // Notify
    // @ts-ignore
    const rinkName = match.rink?.name_ko || "경기";
    const startTime = new Date(match.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });

    await sendPushNotification(
      waiter.user_id,
      "대기 전환 (입금 필요) ⚡️",
      `${rinkName} (${startTime}) 빈 자리가 생겨 대기에서 참가로 전환되었습니다. 경기에 참가하기 위해 결제가 필요합니다!`,
      `/match/${matchId}`
    );
  }
}

export async function joinWaitlist(
  matchId: string, 
  position: string,
  options?: { rental?: boolean }
): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already joined (including waiting)
  const { data: existing } = await supabase
    .from("participants")
    .select("id, status")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Already joined this match" };
  }

  // Get match to verify it exists and is open
  const { data: match } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", matchId)
    .single();

  if (!match) {
    return { error: "Match not found" };
  }

  if (match.status !== "open") {
    return { error: "Match is not open for registration" };
  }

  const isRentalOptIn = options?.rental === true;

  // Insert as waiting - no points deducted for waitlist
  const { error } = await supabase.from("participants").insert({
    match_id: matchId,
    user_id: user.id,
    position: position,
    status: "waiting",
    payment_status: false,
    rental_opt_in: isRentalOptIn,
  });

  if (error) {
    return { error: error.message };
  }

  // 알림 발송: 대기명단 등록 완료
  const { data: matchInfo } = await supabase
    .from("matches")
    .select("start_time, created_by, match_type, rink:rinks(name_ko)")
    .eq("id", matchId)
    .single();

  if (matchInfo) {
    // @ts-ignore
    const rinkName = matchInfo.rink?.name_ko || "경기";
    const startTime = new Date(matchInfo.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });

    await sendPushNotification(
      user.id,
      "대기명단 등록 완료 ⏳",
      `${rinkName} (${startTime}) 대기명단에 등록되었습니다. 자리 발생 시 알려드립니다.`,
      `/match/${matchId}`
    );

    // Audit Log
    await logAndNotify({
      userId: user.id,
      action: "MATCH_JOIN",
      description: `${user.email}님이 ${rinkName} 경기 대기명단에 등록했습니다. ${isRentalOptIn ? "(장비대여)" : ""}`,
      metadata: { matchId, rinkName, status: "waiting", rental: isRentalOptIn },
    });

    // 알림 발송: 경기 생성자(어드민)에게 대기 등록 알림
    // @ts-ignore
    const creatorId = matchInfo.created_by;
    if (creatorId && creatorId !== user.id) {
       // Get participant's name
      const { data: participantProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const participantName = participantProfile?.full_name || user.email?.split("@")[0] || "대기자";

      // @ts-ignore
      const isTrainingWaitlist = matchInfo.match_type === "training";
      
      const adminMsg = isTrainingWaitlist
        ? (isRentalOptIn
          ? `${participantName}님이 ${rinkName} (${startTime}) 훈련에 게스트 대기 신청했습니다. (장비대여)`
          : `${participantName}님이 ${rinkName} (${startTime}) 훈련에 게스트 대기 신청했습니다.`)
        : (isRentalOptIn
          ? `${participantName}님이 ${rinkName} (${startTime}) 경기에 대기 신청했습니다. (장비대여)`
          : `${participantName}님이 ${rinkName} (${startTime}) 경기에 대기 신청했습니다.`);

      await sendPushNotification(
        creatorId,
        "새 대기자 ⏳",
        adminMsg,
        `/admin/matches`
      );
    }
  }

  return { success: true };
}
