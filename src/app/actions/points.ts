"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
 */
export async function calculateRefundPercent(matchStartTime: string): Promise<number> {
  const policy = await getRefundPolicy();
  
  if (!policy || !policy.rules || policy.rules.length === 0) {
    return 100; // 정책이 없으면 전액 환불
  }
  
  const now = new Date();
  const matchStart = new Date(matchStartTime);
  const hoursDiff = (matchStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // 규칙을 hoursBeforeMatch 내림차순으로 정렬
  const sortedRules = [...policy.rules].sort(
    (a, b) => b.hoursBeforeMatch - a.hoursBeforeMatch
  );
  
  for (const rule of sortedRules) {
    if (hoursDiff >= rule.hoursBeforeMatch) {
      return rule.refundPercent;
    }
  }
  
  return 0; // 기본값: 환불 불가
}
