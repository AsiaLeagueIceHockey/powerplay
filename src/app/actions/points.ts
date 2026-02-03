"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushToSuperUsers, sendPushNotification } from "@/app/actions/push";
import { logAndNotify } from "@/lib/audit";

// ==================== 타입 정의 ====================

export interface PointTransaction {
  id: string;
  type: "charge" | "use" | "refund" | "admin_adjustment";
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface ChargeRequest {
  id: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected" | "canceled";
  depositor_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPendingMatch {
  id: string;
  match_id: string;
  position: string;
  entry_points: number;
  start_time: string;
  rink_name: string;
}

// ==================== 포인트 조회 ====================

/**
 * 현재 로그인 사용자의 포인트 잔액 조회
 */
export async function getUserPoints(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  return profile?.points ?? 0;
}

/**
 * 포인트 거래 내역 조회
 */
export async function getPointHistory(
  limit: number = 20,
  offset: number = 0
): Promise<{ transactions: PointTransaction[]; total: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { transactions: [], total: 0 };
  }

  // 전체 개수 조회
  const { count } = await supabase
    .from("point_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 거래 내역 조회
  const { data: transactions, error } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching point history:", error);
    return { transactions: [], total: 0 };
  }

  return {
    transactions: transactions as PointTransaction[],
    total: count ?? 0,
  };
}

/**
 * 사용자의 pending_payment 경기 목록 조회
 */
export async function getUserPendingMatches(): Promise<UserPendingMatch[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: participants, error } = await supabase
    .from("participants")
    .select(`
      id,
      match_id,
      position,
      status,
      match:match_id(entry_points, start_time, rink:rink_id(name_ko, name_en))
    `)
    .eq("user_id", user.id)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending matches:", error);
    return [];
  }

  const now = new Date();
  const validMatches: UserPendingMatch[] = [];
  const expiredParticipantIds: string[] = [];

  (participants || []).forEach((p) => {
    const match = Array.isArray(p.match) ? p.match[0] : p.match;
    // Check expiration
    if (match?.start_time && new Date(match.start_time) < now) {
      expiredParticipantIds.push(p.id);
    } else {
      const rink = match?.rink ? (Array.isArray(match.rink) ? match.rink[0] : match.rink) : null;
      validMatches.push({
        id: p.id,
        match_id: p.match_id,
        position: p.position,
        entry_points: match?.entry_points || 0,
        start_time: match?.start_time || "",
        rink_name: rink?.name_ko || "Unknown",
      });
    }
  });

  // Lazy Expiration: Cancel expired pending matches
  if (expiredParticipantIds.length > 0) {
    // Fire and forget update (or await if strict consistency needed, but assume eventually consistent for UI speed)
    await supabase
      .from("participants")
      .update({ status: "canceled" })
      .in("id", expiredParticipantIds);
      
    console.log(`[LazyExpiration] Canceled ${expiredParticipantIds.length} expired pending applications.`);
  }

  return validMatches;
}

// ==================== 충전 요청 ====================

/**
 * 포인트 충전 신청
 */
export async function requestPointCharge(
  amount: number,
  depositorName: string
): Promise<{ success: boolean; error?: string; chargeRequest?: ChargeRequest }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (amount < 1000) {
    return { success: false, error: "Minimum charge amount is 1,000 points" };
  }

  // 이미 대기중인 요청이 있는지 확인
  const { data: existingRequest } = await supabase
    .from("point_charge_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (existingRequest) {
    return { success: false, error: "You already have a pending charge request" };
  }

  const { data, error } = await supabase
    .from("point_charge_requests")
    .insert({
      user_id: user.id,
      amount,
      depositor_name: depositorName,
      status: "pending",
    })
    .select()
    .single();



  if (error) {
    console.error("Error creating charge request:", error);
    return { success: false, error: error.message };
  }

  // 알림 발송: 슈퍼유저에게 (Unified Audit Log & Push)
  await logAndNotify({
    userId: user.id,
    action: "POINT_CHARGE_REQUEST",
    description: `${user.email}님이 ${amount.toLocaleString()}원 충전을 요청했습니다.`,
    metadata: { requestId: data.id, amount, depositorName },
  });

  // 알림 발송: 사용자에게 (충전 신청 확인)
  await sendPushNotification(
    user.id,
    "충전 신청 완료 📝",
    `${amount.toLocaleString()}원 충전을 신청했습니다. 입금 확인 후 충전이 완료됩니다.`,
    "/mypage/points"
  );

  revalidatePath("/mypage/points");
  return { success: true, chargeRequest: data as ChargeRequest };
}

/**
 * 충전 요청 취소 (본인만 가능, pending 상태일 때만)
 */
export async function cancelChargeRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("point_charge_requests")
    .update({ status: "canceled" })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error canceling charge request:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/mypage/points");
  return { success: true };
}

/**
 * 사용자의 충전 요청 목록 조회
 */
export async function getMyChargeRequests(): Promise<ChargeRequest[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("point_charge_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching charge requests:", error);
    return [];
  }

  return data as ChargeRequest[];
}

// ==================== 플랫폼 설정 조회 (공개) ====================

export interface BankAccountInfo {
  bank: string;
  account: string;
  holder: string;
}

export interface RefundRule {
  hoursBeforeMatch: number;
  refundPercent: number;
}

export interface RefundPolicy {
  rules: RefundRule[];
}

/**
 * 입금 계좌 정보 조회
 */
export async function getPlatformBankAccount(): Promise<BankAccountInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "bank_account")
    .single();

  if (error) {
    console.error("Error fetching bank account:", error);
    return null;
  }
  
  if (!data) {
    return null;
  }

  return data.value as BankAccountInfo;
}

/**
 * 환불 정책 조회
 */
export async function getRefundPolicy(): Promise<RefundPolicy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "refund_policy")
    .single();

  if (error) {
    console.error("Error fetching refund policy:", error);
    return null;
  }
  
  if (!data) {
    return null;
  }

  return data.value as RefundPolicy;
}

/**
 * 경기 취소 시 환불 비율 계산
 * - 경기 전일 23:59까지 (경기 당일 00:00 이전): 100% 환불
 * - 경기 당일 이후: 환불 불가 (0%)
 */
export async function calculateRefundPercent(matchStartTime: string): Promise<number> {
  // 경기 당일 00:00 (전일 자정) 이전이면 100% 환불
  const matchStart = new Date(matchStartTime);
  const matchDayMidnight = new Date(matchStart);
  matchDayMidnight.setHours(0, 0, 0, 0); // 경기 당일 00:00:00
  
  const now = new Date();
  
  if (now < matchDayMidnight) {
    return 100;
  }

  // 경기 당일 이후: 환불 불가
  return 0;
}
