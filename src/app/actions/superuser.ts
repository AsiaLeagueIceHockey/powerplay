"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BankAccountInfo, RefundPolicy, RefundRule } from "./points";

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
 */
export async function confirmPointCharge(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
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
    description: "포인트 충전",
    reference_id: requestId,
  });

  if (transactionError) {
    console.error("Error creating transaction:", transactionError);
    // 거래 내역 실패는 치명적이지 않으므로 계속 진행
  }

  revalidatePath("/admin/charge-requests");
  return { success: true };
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

  revalidatePath("/admin/charge-requests");
  return { success: true };
}
