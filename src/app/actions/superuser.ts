"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BankAccountInfo, RefundPolicy, RefundRule } from "./points";
import { sendPushNotification } from "@/app/actions/push";

// ==================== SuperUser 권한 확인 ====================

/**
 * 현재 사용자가 SuperUser인지 확인
 */
export async function checkIsSuperUser(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "superuser";
}

// ==================== 플랫폼 설정 관리 ====================

/**
 * 입금 계좌 정보 수정 (SuperUser 전용)
 */
export async function updatePlatformBankAccount(
  bankInfo: BankAccountInfo
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 먼저 update 시도
  const { data: updateData, error: updateError } = await supabase
    .from("platform_settings")
    .update({
      value: bankInfo,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "bank_account")
    .select();

  if (updateError) {
    console.error("Error updating bank account:", updateError);
    return { success: false, error: updateError.message };
  }

  // update로 영향받은 행이 없으면 insert
  if (!updateData || updateData.length === 0) {
    const { error: insertError } = await supabase
      .from("platform_settings")
      .insert({
        key: "bank_account",
        value: bankInfo,
        updated_by: user?.id,
      });

    if (insertError) {
      console.error("Error inserting bank account:", insertError);
      return { success: false, error: insertError.message };
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/mypage/points/charge");
  return { success: true };
}

/**
 * 환불 정책 수정 (SuperUser 전용)
 */
export async function updateRefundPolicy(
  rules: RefundRule[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  // 규칙 유효성 검사
  for (const rule of rules) {
    if (rule.hoursBeforeMatch < 0 || rule.refundPercent < 0 || rule.refundPercent > 100) {
      return { success: false, error: "Invalid refund rule values" };
    }
  }

  // hoursBeforeMatch 내림차순으로 정렬
  const sortedRules = [...rules].sort((a, b) => b.hoursBeforeMatch - a.hoursBeforeMatch);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const policy: RefundPolicy = { rules: sortedRules };

  // 먼저 update 시도
  const { data: updateData, error: updateError } = await supabase
    .from("platform_settings")
    .update({
      value: policy,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "refund_policy")
    .select();

  if (updateError) {
    console.error("Error updating refund policy:", updateError);
    return { success: false, error: updateError.message };
  }

  // update로 영향받은 행이 없으면 insert
  if (!updateData || updateData.length === 0) {
    const { error: insertError } = await supabase
      .from("platform_settings")
      .insert({
        key: "refund_policy",
        value: policy,
        updated_by: user?.id,
      });

    if (insertError) {
      console.error("Error inserting refund policy:", insertError);
      return { success: false, error: insertError.message };
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/mypage/points");
  return { success: true };
}

// ==================== 충전 요청 관리 ====================

export interface ChargeRequestWithUser {
  id: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected" | "canceled";
  depositor_name: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

/**
 * 대기중인 충전 요청 목록 조회 (SuperUser 전용)
 */
export async function getPendingChargeRequests(): Promise<ChargeRequestWithUser[]> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  const { data, error } = await supabase
    .from("point_charge_requests")
    .select(
      `
      id,
      amount,
      status,
      depositor_name,
      reject_reason,
      created_at,
      updated_at,
      user:user_id(id, email, full_name)
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending charge requests:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    user: Array.isArray(item.user) ? item.user[0] : item.user,
  })) as ChargeRequestWithUser[];
}

/**
 * 모든 충전 요청 목록 조회 (SuperUser 전용)
 */
export async function getAllChargeRequests(
  status?: "pending" | "confirmed" | "rejected" | "canceled"
): Promise<ChargeRequestWithUser[]> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  let query = supabase
    .from("point_charge_requests")
    .select(
      `
      id,
      amount,
      status,
      depositor_name,
      reject_reason,
      created_at,
      updated_at,
      user:user_id(id, email, full_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching charge requests:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    user: Array.isArray(item.user) ? item.user[0] : item.user,
  })) as ChargeRequestWithUser[];
}

/**
 * 입금 확인 및 포인트 적립 (SuperUser 전용)
 * + 포인트 충전 후 pending_payment 경기들 자동 확정
 */
export async function confirmPointCharge(
  requestId: string
): Promise<{ success: boolean; error?: string; autoConfirmedMatches?: number }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // 충전 요청 조회
  const { data: chargeRequest, error: fetchError } = await supabase
    .from("point_charge_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (fetchError || !chargeRequest) {
    return { success: false, error: "Charge request not found or already processed" };
  }

  // 사용자 현재 포인트 조회
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", chargeRequest.user_id)
    .single();

  if (profileError || !userProfile) {
    return { success: false, error: "User profile not found" };
  }

  const newBalance = (userProfile.points || 0) + chargeRequest.amount;

  // 트랜잭션: 포인트 적립 + 요청 상태 변경 + 거래 내역 추가
  // Supabase는 진정한 트랜잭션을 지원하지 않으므로 순차 실행
  
  // 1. 포인트 업데이트
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: newBalance })
    .eq("id", chargeRequest.user_id);

  if (updateError) {
    console.error("Error updating points:", updateError);
    return { success: false, error: "Failed to update points" };
  }

  // 2. 충전 요청 상태 변경
  const { error: requestError } = await supabase
    .from("point_charge_requests")
    .update({
      status: "confirmed",
      confirmed_by: adminUser?.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestError) {
    console.error("Error updating charge request:", requestError);
    // 롤백 시도
    await supabase
      .from("profiles")
      .update({ points: userProfile.points })
      .eq("id", chargeRequest.user_id);
    return { success: false, error: "Failed to update request status" };
  }

  // 3. 거래 내역 추가
  const { error: transactionError } = await supabase.from("point_transactions").insert({
    user_id: chargeRequest.user_id,
    type: "charge",
    amount: chargeRequest.amount,
    balance_after: newBalance,
    description: "금액 충전",
    reference_id: requestId,
  });

  if (transactionError) {
    console.error("Error creating transaction:", transactionError);
    // 거래 내역 실패는 치명적이지 않으므로 계속 진행
  }

  // 4. ⭐ 자동 경기 확정: pending_payment 경기들 처리
  let autoConfirmedCount = 0;
  let currentBalance = newBalance;

  // pending_payment 경기 조회 (경기 시작 시간 순)
  const { data: pendingParticipants } = await supabase
    .from("participants")
    .select(`
      id,
      match_id,
      user_id,
      position,
      match:match_id(id, entry_points, start_time, rink:rink_id(name_ko))
    `)
    .eq("user_id", chargeRequest.user_id)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: true });

  if (pendingParticipants && pendingParticipants.length > 0) {
    // 경기 시작 시간 순으로 정렬
    const sortedParticipants = [...pendingParticipants].sort((a, b) => {
      const matchA = Array.isArray(a.match) ? a.match[0] : a.match;
      const matchB = Array.isArray(b.match) ? b.match[0] : b.match;
      return new Date(matchA?.start_time || 0).getTime() - new Date(matchB?.start_time || 0).getTime();
    });

    for (const participant of sortedParticipants) {
      const match = Array.isArray(participant.match) ? participant.match[0] : participant.match;
      const entryPoints = match?.entry_points || 0;

      if (currentBalance >= entryPoints && entryPoints > 0) {
        // 포인트 차감
        currentBalance -= entryPoints;

        // 참가자 상태 업데이트
        await supabase
          .from("participants")
          .update({
            status: "confirmed",
            payment_status: true,
          })
          .eq("id", participant.id);

        // 거래 내역 추가
        await supabase.from("point_transactions").insert({
          user_id: chargeRequest.user_id,
          type: "use",
          amount: -entryPoints,
          balance_after: currentBalance,
          description: "경기 참가 (자동 확정)",
          reference_id: participant.match_id,
        });

        autoConfirmedCount++;
      }
    }

    // 최종 잔액 업데이트
    if (autoConfirmedCount > 0) {
      await supabase
        .from("profiles")
        .update({ points: currentBalance })
        .eq("id", chargeRequest.user_id);
    }
  }

  revalidatePath("/admin/charge-requests");

  // 알림 발송: 사용자에게 (포인트 충전 완료 + 자동 확정 경기 수)
  const notificationMessage = autoConfirmedCount > 0
    ? `${chargeRequest.amount.toLocaleString()}원이 충전되었습니다. ${autoConfirmedCount}개의 경기 참가가 자동 확정되었습니다.`
    : `${chargeRequest.amount.toLocaleString()}원이 충전되었습니다. 현재 잔액: ${currentBalance.toLocaleString()}원`;

  await sendPushNotification(
    chargeRequest.user_id,
    autoConfirmedCount > 0 ? "충전 완료 + 경기 확정 ✅" : "충전 완료 💰",
    notificationMessage,
    "/mypage/points"
  );

  return { success: true, autoConfirmedMatches: autoConfirmedCount };
}

/**
 * 충전 요청 거부 (SuperUser 전용)
 */
export async function rejectPointCharge(
  requestId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // Get charge request details for notification
  const { data: chargeRequest } = await supabase
    .from("point_charge_requests")
    .select("user_id, amount")
    .eq("id", requestId)
    .single();

  const { error } = await supabase
    .from("point_charge_requests")
    .update({
      status: "rejected",
      reject_reason: reason || null,
      confirmed_by: adminUser?.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    console.error("Error rejecting charge request:", error);
    return { success: false, error: error.message };
  }

  // 알림 발송: 사용자에게 (충전 요청 거부)
  if (chargeRequest) {
    const rejectMessage = reason
      ? `${chargeRequest.amount.toLocaleString()}원 충전 요청이 거부되었습니다. 사유: ${reason}`
      : `${chargeRequest.amount.toLocaleString()}원 충전 요청이 거부되었습니다. 입금자명 확인 후 다시 신청해주세요.`;

    await sendPushNotification(
      chargeRequest.user_id,
      "충전 요청 거부 ❌",
      rejectMessage,
      "/mypage/points"
    );
  }

  revalidatePath("/admin/charge-requests");
  return { success: true };
}

// ==================== 미입금 참가자 관리 ====================

export interface PendingParticipant {
  id: string;
  match_id: string;
  position: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    points: number;
  } | null;
  match: {
    id: string;
    start_time: string;
    entry_points: number;
    rink: {
      name_ko: string;
      name_en: string;
    } | null;
  } | null;
}

/**
 * 미입금 참가자 목록 조회 (SuperUser 전용)
 */
export async function getPendingPaymentParticipants(): Promise<PendingParticipant[]> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  const { data, error } = await supabase
    .from("participants")
    .select(`
      id,
      match_id,
      position,
      created_at,
      user:user_id(id, email, full_name, points),
      match:match_id(id, start_time, entry_points, rink:rink_id(name_ko, name_en))
    `)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending payment participants:", error);
    return [];
  }

  return (data || []).map((item) => {
    const user = Array.isArray(item.user) ? item.user[0] : item.user;
    const match = Array.isArray(item.match) ? item.match[0] : item.match;
    const rink = match?.rink ? (Array.isArray(match.rink) ? match.rink[0] : match.rink) : null;
    
    return {
      ...item,
      user,
      match: match ? { ...match, rink } : null,
    };
  }) as PendingParticipant[];
}

/**
 * 참가자 입금 확인 (SuperUser 전용)
 * - 사용자 포인트에서 차감
 * - 참가 상태를 confirmed로 변경
 */
export async function confirmParticipantPayment(
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  // Get participant info
  const { data: participant, error: fetchError } = await supabase
    .from("participants")
    .select(`
      id,
      user_id,
      match_id,
      match:match_id(entry_points)
    `)
    .eq("id", participantId)
    .eq("status", "pending_payment")
    .single();

  if (fetchError || !participant) {
    return { success: false, error: "Participant not found or already confirmed" };
  }

  const match = Array.isArray(participant.match) ? participant.match[0] : participant.match;
  const entryPoints = match?.entry_points || 0;

  // Get user's current points
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", participant.user_id)
    .single();

  if (profileError || !userProfile) {
    return { success: false, error: "User profile not found" };
  }

  const currentPoints = userProfile.points || 0;



  // IMPORTANT: For pending_payment confirmation, we DO NOT check insufficient funds.
  // Instead, we perform a 2-step process: 
  // 1. Charge points (Deposit)
  // 2. Use points (Payment)
  
  // 1. Log Charge (Auto Deposit)
  await supabase.from("point_transactions").insert({
    user_id: participant.user_id,
    type: "charge",
    amount: entryPoints,
    balance_after: currentPoints + entryPoints,
    description: "경기 참가비 입금 확인 (자동 충전)",
    reference_id: participant.match_id,
  });

  // 2. Log Use (Payment)
  await supabase.from("point_transactions").insert({
    user_id: participant.user_id,
    type: "use",
    amount: -entryPoints,
    balance_after: currentPoints, // Back to original balance
    description: "경기 참가 확정 (자동 결제)",
    reference_id: participant.match_id,
  });

  // 3. Update Participant Status and Payment Status
  const { error: participantError } = await supabase
    .from("participants")
    .update({
      status: "confirmed",
      payment_status: true,
    })
    .eq("id", participantId);

  if (participantError) {
    console.error("Error updating participant:", participantError);
    return { success: false, error: "Failed to confirm participant" };
  }

  // 4. Update Profile (Optional validation, keeping balance same)
  // No need to update profile points as the net change is 0.

  revalidatePath("/admin/charge-requests");

  // 알림 발송: 사용자에게
  if (participant && participant.match) {
    // @ts-ignore
    const matchTime = new Date(participant.match.start_time).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Seoul"
    });
    
    await sendPushNotification(
      participant.user_id,
      "참가 확정 ✅",
      `대기하시던 경기(${matchTime}) 참가가 확정되었습니다.`,
      `/match/${participant.match_id}`
    );
  }

  return { success: true };
}

/**
 * 미입금 참가자 취소 (SuperUser 전용)
 */
export async function cancelPendingParticipant(
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId)
    .eq("status", "pending_payment");

  if (error) {
    console.error("Error canceling pending participant:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/charge-requests");
  return { success: true };
}

// ==================== ALL MATCHES (SuperUser Only) ====================

export async function getAllMatchesForSuperuser() {
  const supabase = await createClient();

  // Verify superuser
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  // Fetch ALL matches
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      start_time,
      fee,
      max_skaters,
      max_goalies,
      status,
      description,
      rink:rink_id(name_ko, name_en),
      created_by
      `
    )
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching all matches:", error);
    return [];
  }

  // Fetch creator profiles
  const creatorIds = Array.from(new Set(matches.map(m => m.created_by).filter(Boolean)));
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", creatorIds);
  
  const creatorMap = new Map(creators?.map(c => [c.id, c]));

  // Fetch participants for each match
  const matchesWithDetails = await Promise.all(
    matches.map(async (match) => {
      const { data: participants } = await supabase
        .from("participants")
        .select(`
          id,
          position,
          status,
          payment_status,
          team_color,
          user:user_id(id, full_name, email)
        `)
        .eq("match_id", match.id)
        .order("created_at", { ascending: true }); // Keep order
      
      const validParticipants = participants?.filter(p => ["applied", "confirmed"].includes(p.status)) || [];

      // Counts
      const counts = {
        fw: validParticipants.filter(p => p.position === 'FW').length || 0,
        df: validParticipants.filter(p => p.position === 'DF').length || 0,
        g: validParticipants.filter(p => p.position === 'G').length || 0,
      };

      // Transform for UI (flatten user array if needed, usually supabase returns object or array depending on query. `user:user_id` implies object if single relation, but type is slightly ambiguous without checking. I'll treat it safely.)
      const transformedParticipants = (participants || []).map((p) => {
        const user = Array.isArray(p.user) ? p.user[0] : p.user;
        return {
          ...p,
          user,
        };
      });

      return {
        ...match,
        rink: Array.isArray(match.rink) ? match.rink[0] : match.rink,
        creator: creatorMap.get(match.created_by) || { email: "Unknown", full_name: "Unknown" },
        participants: transformedParticipants, // Include full list for Card
        participants_count: counts,
      };
    })
  );

  return matchesWithDetails;
}

// ==================== PUSH NOTIFICATION TEST (SuperUser Only) ====================

export interface PushSubscriber {
  id: string;
  email: string;
  full_name: string | null;
  subscription_count: number;
}

export async function getPushSubscribers(): Promise<PushSubscriber[]> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  // Get distinct user_ids from push_subscriptions
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, user:profiles(id, email, full_name)");

  if (error) {
    console.error("Error fetching subscribers:", error);
    return [];
  }

  const subscriberMap = new Map<string, PushSubscriber>();

  data?.forEach((sub) => {
    if (sub.user) {
        // @ts-ignore
      const user = Array.isArray(sub.user) ? sub.user[0] : sub.user;
      if (user && !subscriberMap.has(user.id)) {
        subscriberMap.set(user.id, {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_count: 0
        });
      }
      if (user && subscriberMap.has(user.id)) {
        const entry = subscriberMap.get(user.id)!;
        entry.subscription_count++;
      }
    }
  });

  return Array.from(subscriberMap.values())
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
}

export async function sendTestPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await sendPushNotification(userId, title, body, "/");
    return { success: result.success, error: result.error, count: result.sent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ==================== POINT STATUS MANAGEMENT (SuperUser Only) ====================

export interface UserPointStatus {
  id: string;
  email: string;
  full_name: string | null;
  points: number;
}

export interface PointTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export async function getAllUserPoints(search?: string): Promise<UserPointStatus[]> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) return [];

  let query = supabase.from("profiles").select("id, email, full_name, points").order("full_name");

  if (search) {
     query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  } else {
     query = query.limit(50);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching user points:", error);
    return [];
  }
  return data as UserPointStatus[];
}

export async function getUserTransactionHistory(userId: string): Promise<PointTransaction[]> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) return [];

  const { data, error } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
  return data as PointTransaction[];
}

export async function updateUserPoints(
  userId: string,
  newAmount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) return { success: false, error: "Unauthorized" };

  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();

  if (profileError || !userProfile) {
    return { success: false, error: "User not found" };
  }

  const currentPoints = userProfile.points || 0;
  const diff = newAmount - currentPoints;

  if (diff === 0) return { success: true }; // No change

  // Updates
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ points: newAmount })
    .eq("id", userId);

  if (updateError) return { success: false, error: updateError.message };

  // Log Transaction
  await supabase.from("point_transactions").insert({
    user_id: userId,
    type: diff > 0 ? "charge" : "use", 
    amount: diff,
    balance_after: newAmount,
    description: reason || "관리자 충전 금액 조정",
    reference_id: null,
  });

  revalidatePath("/admin/points");

  // Send Push Notification
  try {
    await sendPushNotification(
        userId,
        "충전 금액 변동 알림 💰",
        `관리자에 의해 충전 금액이 변경되었습니다.\n${currentPoints.toLocaleString()}원 -> ${newAmount.toLocaleString()}원\n사유: ${reason}`,
        "/mypage/points"
    );
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }

  return { success: true };
}

// ==================== Audit Logs (SuperUser Only) ====================

export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  action_type: string;
  description: string;
  metadata: any;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const supabase = await createClient();

  const isSuperUser = await checkIsSuperUser();
  if (!isSuperUser) {
    return [];
  }

  // 1. Fetch Audit Logs
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  if (!logs || logs.length === 0) {
    return [];
  }

  // 2. Fetch User Profiles manually
  const userIds = Array.from(new Set(logs.map((log) => log.user_id).filter(Boolean)));
  
  let userMap = new Map<string, { id: string; email: string; full_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);
      
    if (profiles) {
      profiles.forEach(p => userMap.set(p.id, p));
    }
  }

  // 3. Combine
  return logs.map((log) => ({
    ...log,
    user: log.user_id ? userMap.get(log.user_id) || null : null,
  })) as AuditLog[];
}
