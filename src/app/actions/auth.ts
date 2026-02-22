"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logAndNotify } from "@/lib/audit";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "https://pphockey.vercel.app";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/ko/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle(origin: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/ko/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to get OAuth URL" };
}

export async function signInWithKakao(origin: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${origin}/ko/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to get OAuth URL" };
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Build updateData dynamically based on what's provided in formData
  const updateData: Record<string, unknown> = {};

  if (formData.has("fullName")) updateData.full_name = formData.get("fullName");
  if (formData.has("position")) updateData.position = formData.get("position") || null;
  if (formData.has("preferredLang")) updateData.preferred_lang = formData.get("preferredLang");
  if (formData.has("phone")) updateData.phone = formData.get("phone") || null;
  if (formData.has("birthDate")) updateData.birth_date = formData.get("birthDate") || null;
  if (formData.has("termsAgreed")) updateData.terms_agreed = formData.get("termsAgreed") === "true";
  if (formData.has("bio")) updateData.bio = formData.get("bio") || null;
  if (formData.has("hockeyStartDate")) updateData.hockey_start_date = formData.get("hockeyStartDate") || null;
  if (formData.has("primaryClubId")) updateData.primary_club_id = formData.get("primaryClubId") || null;
  if (formData.has("stickDirection")) updateData.stick_direction = formData.get("stickDirection") || null;
  if (formData.has("detailedPositions")) {
    const rawPositions = formData.get("detailedPositions");
    if (typeof rawPositions === "string") {
      try {
        updateData.detailed_positions = JSON.parse(rawPositions);
      } catch {
        updateData.detailed_positions = null;
      }
    }
  }

  // Only set onboarding_completed if explicitly provided
  if (formData.has("onboarding_completed")) {
    updateData.onboarding_completed = formData.get("onboarding_completed") === "true";
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile", "page");
  revalidatePath("/onboarding", "page");

  // 새 사용자 온보딩 완료 시 SuperUser에게 알림 발송
  if (updateData.onboarding_completed === true) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const userEmail = currentUser?.email || "unknown";
    const userName = updateData.full_name || userEmail;

    await logAndNotify({
      userId: user.id,
      action: "USER_SIGNUP",
      description: `새 사용자 가입: ${userName} (${userEmail})`,
      metadata: { email: userEmail, name: userName },
    });
  }

  return { success: true };
}

export async function issuePlayerCard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Generate sequence using RPC since doing it inline with update is tricky without returning
  // We'll create a simple function to get the next val, or use a workaround
  // Wait, let's just do a direct query or create a function. A direct query via supabase-js isn't possible.
  // We need an RPC call. Wait, I should create a function `get_next_player_card_seq`
  // Let me just update auth.ts first and add the sql file for the function next.

  const { data: seqData, error: seqError } = await supabase.rpc('get_next_player_card_seq');
  if (seqError) {
     return { error: "Failed to generate serial number" };
  }

  const serialNum = seqData as number;

  const { error } = await supabase
    .from("profiles")
    .update({ 
      card_issued_at: new Date().toISOString(),
      card_serial_number: serialNum
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mypage", "page");
  revalidatePath("/mypage/card", "page");

  return { success: true, serialNumber: serialNum };
}

// 관리자 신청
export async function applyForAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// 회원 탈퇴 (Soft Delete)
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Soft delete: deleted_at 타임스탬프 설정
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  // 로그아웃 처리
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

