"use server";

import { revalidatePath } from "next/cache";

import {
  sendPushNotification,
  sendPushToSuperUsers,
} from "@/app/actions/push";
import type { LoungeBusiness } from "@/app/actions/lounge";
import {
  buildLoungeNoticeDetailPath,
  fanOutLoungeNotice,
  isValidRequestId,
  validateLoungeNoticeInput,
  type LoungeNotice,
  type LoungeNoticeFanoutSummary,
} from "@/lib/lounge-notices";
import { createClient } from "@/lib/supabase/server";

export type { LoungeNotice, LoungeNoticeFanoutSummary } from "@/lib/lounge-notices";

export interface LoungeNoticeDetail {
  notice: LoungeNotice;
  business: LoungeBusiness;
}

export interface LoungeNoticeMutationResult {
  success: boolean;
  notice?: LoungeNotice;
  created?: boolean;
  delivery?: LoungeNoticeFanoutSummary;
  error?: string;
}

export interface LoungeNoticeSubscriptionResult {
  success: boolean;
  subscribed?: boolean;
  error?: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface AuthorizedBusiness {
  userId: string;
  business: LoungeBusiness;
  isSuperUser: boolean;
}

const NOTICE_COLUMNS =
  "id, business_id, title, body, created_by, request_id, created_at, updated_at";

function revalidateLoungeNoticePaths(businessSlug: string, noticeId: string) {
  for (const locale of ["ko", "en"] as const) {
    revalidatePath(`/${locale}/admin/lounge`);
    revalidatePath(`/${locale}/lounge/${businessSlug}`);
    revalidatePath(buildLoungeNoticeDetailPath(locale, businessSlug, noticeId));
  }
}

async function getAuthorizedBusiness(
  supabase: SupabaseServerClient,
  businessId: string
): Promise<AuthorizedBusiness | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("lounge_businesses").select("*").eq("id", businessId).maybeSingle(),
  ]);

  const isSuperUser = profile?.role === "superuser";
  if (!business || (!isSuperUser && business.owner_user_id !== user.id)) {
    return null;
  }

  if (isSuperUser) {
    return { userId: user.id, business: business as LoungeBusiness, isSuperUser };
  }

  if (profile?.role !== "admin") return null;

  const now = new Date().toISOString();
  const { data: membership } = await supabase
    .from("lounge_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .limit(1)
    .maybeSingle();

  return membership
    ? { userId: user.id, business: business as LoungeBusiness, isSuperUser }
    : null;
}

async function isPubliclyVisibleBusiness(
  supabase: SupabaseServerClient,
  businessId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_visible_lounge_business", {
    target_business_id: businessId,
  });

  if (error) {
    console.error("[LOUNGE_NOTICE] visibility-check-failed", {
      businessId,
      error: error.message,
    });
    return false;
  }

  return data === true;
}

export async function getPublicLoungeNotices(
  businessId: string
): Promise<LoungeNotice[]> {
  if (!businessId) return [];

  const supabase = await createClient();
  if (!(await isPubliclyVisibleBusiness(supabase, businessId))) return [];

  const { data, error } = await supabase
    .from("lounge_notices")
    .select(NOTICE_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[LOUNGE_NOTICE] public-list-failed", {
      businessId,
      error: error.message,
    });
    return [];
  }

  return (data as LoungeNotice[] | null) ?? [];
}

export async function getPublicLoungeNoticeDetail(
  businessSlug: string,
  noticeId: string
): Promise<LoungeNoticeDetail | null> {
  if (!businessSlug || !noticeId) return null;

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("lounge_businesses")
    .select("*")
    .eq("slug", businessSlug)
    .maybeSingle();

  if (businessError || !business) return null;
  if (!(await isPubliclyVisibleBusiness(supabase, business.id))) return null;

  const { data, error } = await supabase
    .from("lounge_notices")
    .select(NOTICE_COLUMNS)
    .eq("id", noticeId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !data) return null;

  return { notice: data as LoungeNotice, business: business as LoungeBusiness };
}

export async function getManagedLoungeNotices(
  businessId: string
): Promise<LoungeNotice[]> {
  if (!businessId) return [];

  const supabase = await createClient();
  if (!(await getAuthorizedBusiness(supabase, businessId))) return [];

  const { data, error } = await supabase
    .from("lounge_notices")
    .select(NOTICE_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[LOUNGE_NOTICE] managed-list-failed", {
      businessId,
      error: error.message,
    });
    throw new Error("Failed to load managed Lounge notices");
  }

  return (data as LoungeNotice[] | null) ?? [];
}

export async function createLoungeNotice(
  formData: FormData
): Promise<LoungeNoticeMutationResult> {
  const businessId = String(formData.get("business_id") ?? "").trim();
  const requestId = String(formData.get("request_id") ?? "").trim();
  const input = validateLoungeNoticeInput(
    String(formData.get("title") ?? ""),
    String(formData.get("body") ?? "")
  );

  if (!businessId) return { success: false, error: "Business is required" };
  if (!isValidRequestId(requestId)) {
    return { success: false, error: "A valid request ID is required" };
  }
  if (!input.ok) return { success: false, error: input.error };

  const supabase = await createClient();
  const authorization = await getAuthorizedBusiness(supabase, businessId);
  if (!authorization) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("lounge_notices")
    .insert({
      business_id: businessId,
      title: input.title,
      body: input.body,
      created_by: authorization.userId,
      request_id: requestId,
    })
    .select(NOTICE_COLUMNS)
    .single();

  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("lounge_notices")
      .select(NOTICE_COLUMNS)
      .eq("business_id", businessId)
      .eq("request_id", requestId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("[LOUNGE_NOTICE] retry-lookup-failed", {
        businessId,
        error: existingError?.message ?? "Notice not found after unique conflict",
      });
      return { success: false, error: "Could not recover the existing notice" };
    }

    return { success: true, notice: existing as LoungeNotice, created: false };
  }

  if (error || !data) {
    console.error("[LOUNGE_NOTICE] create-failed", {
      businessId,
      error: error?.message ?? "No notice returned",
    });
    return { success: false, error: error?.message ?? "Failed to create notice" };
  }

  const notice = data as LoungeNotice;
  console.info("[LOUNGE_NOTICE] persisted", { businessId, noticeId: notice.id });

  revalidateLoungeNoticePaths(authorization.business.slug, notice.id);

  try {
    const superuserDelivery = await sendPushToSuperUsers(
      `${authorization.business.name} 새 라운지 공지`,
      notice.title,
      "/ko/admin/lounge-management"
    );
    console.info("[LOUNGE_NOTICE] superuser-delivery-completed", {
      businessId,
      noticeId: notice.id,
      ...superuserDelivery,
    });
  } catch (superuserError) {
    console.error("[LOUNGE_NOTICE] superuser-delivery-failed", {
      businessId,
      noticeId: notice.id,
      error: superuserError instanceof Error ? superuserError.message : "Unknown error",
    });
  }

  const { data: recipientRows, error: recipientError } = await supabase.rpc(
    "get_lounge_notice_subscriber_ids",
    { target_business_id: businessId }
  );

  if (recipientError) {
    console.error("[LOUNGE_NOTICE] recipient-lookup-failed", {
      businessId,
      noticeId: notice.id,
      error: recipientError.message,
    });
    return { success: true, notice, created: true };
  }

  const subscriberIds = ((recipientRows as Array<{ user_id: string }> | null) ?? []).map(
    (row) => row.user_id
  );
  const detailUrl = buildLoungeNoticeDetailPath("ko", authorization.business.slug, notice.id);

  console.info("[LOUNGE_NOTICE] fan-out-started", {
    businessId,
    noticeId: notice.id,
    intendedUsers: new Set(
      subscriberIds.filter((subscriberId) => subscriberId !== authorization.userId)
    ).size,
  });

  const delivery = await fanOutLoungeNotice(
    subscriberIds,
    authorization.userId,
    (userId) =>
      sendPushNotification(
        userId,
        `${authorization.business.name} 새 공지`,
        notice.title,
        detailUrl,
        {
          skipEmail: true,
        }
      )
  );

  console.info("[LOUNGE_NOTICE] fan-out-completed", {
    businessId,
    noticeId: notice.id,
    ...delivery,
  });

  return { success: true, notice, created: true, delivery };
}

export async function updateLoungeNotice(
  formData: FormData
): Promise<LoungeNoticeMutationResult> {
  const noticeId = String(formData.get("notice_id") ?? "").trim();
  const input = validateLoungeNoticeInput(
    String(formData.get("title") ?? ""),
    String(formData.get("body") ?? "")
  );

  if (!noticeId) return { success: false, error: "Notice is required" };
  if (!input.ok) return { success: false, error: input.error };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("lounge_notices")
    .select(NOTICE_COLUMNS)
    .eq("id", noticeId)
    .maybeSingle();

  if (!current) return { success: false, error: "Unauthorized" };

  const authorization = await getAuthorizedBusiness(supabase, current.business_id);
  if (!authorization) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("lounge_notices")
    .update({ title: input.title, body: input.body })
    .eq("id", noticeId)
    .eq("business_id", current.business_id)
    .select(NOTICE_COLUMNS)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to update notice" };
  }

  revalidateLoungeNoticePaths(authorization.business.slug, noticeId);

  return { success: true, notice: data as LoungeNotice };
}

export async function deleteLoungeNotice(
  noticeId: string
): Promise<LoungeNoticeMutationResult> {
  if (!noticeId) return { success: false, error: "Notice is required" };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("lounge_notices")
    .select(NOTICE_COLUMNS)
    .eq("id", noticeId)
    .maybeSingle();

  if (!current) return { success: false, error: "Unauthorized" };

  const authorization = await getAuthorizedBusiness(supabase, current.business_id);
  if (!authorization) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("lounge_notices")
    .delete()
    .eq("id", noticeId)
    .eq("business_id", current.business_id);

  if (error) return { success: false, error: error.message };

  revalidateLoungeNoticePaths(authorization.business.slug, noticeId);

  return { success: true };
}

export async function getMyLoungeNoticeSubscription(
  businessId: string
): Promise<boolean> {
  if (!businessId) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("lounge_notice_subscriptions")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function subscribeToLoungeNotices(
  businessId: string
): Promise<LoungeNoticeSubscriptionResult> {
  if (!businessId) return { success: false, error: "Business is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("lounge_notice_subscriptions").insert({
    business_id: businessId,
    user_id: user.id,
  });

  if (error && error.code !== "23505") {
    return { success: false, error: error.message };
  }

  for (const locale of ["ko", "en"] as const) {
    revalidatePath(`/${locale}/lounge`, "layout");
  }
  return { success: true, subscribed: true };
}

export async function unsubscribeFromLoungeNotices(
  businessId: string
): Promise<LoungeNoticeSubscriptionResult> {
  if (!businessId) return { success: false, error: "Business is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("lounge_notice_subscriptions")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  for (const locale of ["ko", "en"] as const) {
    revalidatePath(`/${locale}/lounge`, "layout");
  }
  return { success: true, subscribed: false };
}
