"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminInfo } from "./admin-check";
import { getAdmins } from "./admin";
import { checkIsSuperUser } from "./superuser";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LoungeBusinessCategory =
  | "lesson"
  | "training_center"
  | "tournament"
  | "brand"
  | "service";

export type LoungeEventCategory =
  | "lesson"
  | "training"
  | "tournament"
  | "promotion";

export type LoungeCtaType = "phone" | "kakao" | "instagram" | "website" | "detail";

export interface LoungeMembership {
  id: string;
  user_id: string;
  status: "active" | "expired" | "canceled";
  starts_at: string;
  ends_at: string;
  price_krw: number;
  inquiry_channel: "kakao" | "instagram" | "manual" | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
}

export interface LoungeEvent {
  id: string;
  business_id: string;
  category: LoungeEventCategory;
  title: string;
  summary: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  price_krw: number | null;
  max_participants: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoungeBusiness {
  id: string;
  owner_user_id: string;
  category: LoungeBusinessCategory;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  kakao_open_chat_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  upcoming_events?: LoungeEvent[];
}

export interface LoungeMetricsSummary {
  businessImpressions: number;
  businessClicks: number;
  eventImpressions: number;
  eventClicks: number;
  ctaClicks: Record<LoungeCtaType, number>;
}

function isMembershipActive(membership: LoungeMembership | null) {
  if (!membership || membership.status === "canceled") return false;
  const now = new Date();
  return new Date(membership.starts_at) <= now && new Date(membership.ends_at) >= now;
}

function buildMetricsSummary(
  rows: Array<{ metric_type: "impression" | "click"; cta_type: LoungeCtaType | null; event_id: string | null }>
): LoungeMetricsSummary {
  const summary: LoungeMetricsSummary = {
    businessImpressions: 0,
    businessClicks: 0,
    eventImpressions: 0,
    eventClicks: 0,
    ctaClicks: {
      phone: 0,
      kakao: 0,
      instagram: 0,
      website: 0,
      detail: 0,
    },
  };

  rows.forEach((row) => {
    const isEvent = !!row.event_id;
    if (row.metric_type === "impression") {
      if (isEvent) summary.eventImpressions += 1;
      else summary.businessImpressions += 1;
      return;
    }

    if (isEvent) summary.eventClicks += 1;
    else summary.businessClicks += 1;

    if (row.cta_type) {
      summary.ctaClicks[row.cta_type] += 1;
    }
  });

  return summary;
}

async function getLatestMembership(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lounge_memberships")
    .select("*")
    .eq("user_id", userId)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as LoungeMembership | null) ?? null;
}

async function getActivePublishedBusinesses(supabase: SupabaseServerClient) {
  const { data: businesses } = await supabase
    .from("lounge_businesses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const businessRows = (businesses as LoungeBusiness[] | null) ?? [];
  if (businessRows.length === 0) {
    return [];
  }

  const ownerIds = businessRows.map((business) => business.owner_user_id);
  const { data: memberships } = await supabase
    .from("lounge_memberships")
    .select("user_id, starts_at, ends_at, status")
    .in("user_id", ownerIds);

  const activeOwnerIds = new Set(
    ((memberships as Array<Pick<LoungeMembership, "user_id" | "starts_at" | "ends_at" | "status">> | null) ?? [])
      .filter((membership) => {
        if (membership.status !== "active") return false;
        const now = new Date();
        return new Date(membership.starts_at) <= now && new Date(membership.ends_at) >= now;
      })
      .map((membership) => membership.user_id)
  );

  return businessRows.filter((business) => activeOwnerIds.has(business.owner_user_id));
}

async function getUpcomingPublishedEvents(
  supabase: SupabaseServerClient,
  businessIds: string[]
) {
  if (businessIds.length === 0) {
    return [];
  }

  const { data: events } = await supabase
    .from("lounge_events")
    .select("*")
    .in("business_id", businessIds)
    .eq("is_published", true)
    .order("start_time", { ascending: true });

  return ((events as LoungeEvent[] | null) ?? []).filter(
    (event) => new Date(event.start_time) >= new Date()
  );
}

export async function getLoungeAdminPageData() {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return {
      ok: false,
      reason: "unauthorized" as const,
    };
  }

  const [membership, business, isSuperUser] = await Promise.all([
    getLatestMembership(adminInfo.userId),
    supabase
      .from("lounge_businesses")
      .select("*")
      .eq("owner_user_id", adminInfo.userId)
      .maybeSingle(),
    checkIsSuperUser(),
  ]);

  const businessData = (business.data as LoungeBusiness | null) ?? null;
  const events = businessData
    ? await supabase
        .from("lounge_events")
        .select("*")
        .eq("business_id", businessData.id)
        .order("start_time", { ascending: true })
    : { data: [] as LoungeEvent[] };

  const metrics = businessData
    ? await supabase
        .from("lounge_metrics")
        .select("metric_type, cta_type, event_id")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false })
        .limit(1000)
    : { data: [] as Array<{ metric_type: "impression" | "click"; cta_type: LoungeCtaType | null; event_id: string | null }> };

  const membershipStatus = !membership ? "none" : isMembershipActive(membership) ? "active" : "expired";

  const superuserData = isSuperUser
    ? await Promise.all([
        supabase
          .from("lounge_memberships")
          .select(`
            *,
            user:user_id(id, email, full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(30),
        getAdmins(),
      ])
    : null;

  return {
    ok: true,
    reason: null,
    membership,
    membershipStatus,
    business: businessData,
    events: (events.data as LoungeEvent[]) ?? [],
    metrics: buildMetricsSummary(metrics.data ?? []),
    isSuperUser,
    memberships: (superuserData?.[0].data as LoungeMembership[]) ?? [],
    admins: superuserData?.[1] ?? [],
  };
}

export async function getPublicLoungeData(): Promise<{
  businesses: LoungeBusiness[];
  events: LoungeEvent[];
}> {
  const supabase = await createClient();
  const activeBusinesses = await getActivePublishedBusinesses(supabase);
  if (activeBusinesses.length === 0) {
    return { businesses: [], events: [] };
  }

  const upcomingEvents = await getUpcomingPublishedEvents(
    supabase,
    activeBusinesses.map((business) => business.id)
  );

  const eventsByBusiness = new Map<string, LoungeEvent[]>();
  upcomingEvents.forEach((event) => {
    const existing = eventsByBusiness.get(event.business_id) ?? [];
    existing.push(event);
    eventsByBusiness.set(event.business_id, existing);
  });

  return {
    businesses: activeBusinesses.map((business) => ({
      ...business,
      upcoming_events: eventsByBusiness.get(business.id) ?? [],
    })),
    events: upcomingEvents,
  };
}

export async function getPublicLoungeBusinessDetail(businessId: string): Promise<{
  business: LoungeBusiness | null;
  events: LoungeEvent[];
  relatedBusinesses: LoungeBusiness[];
}> {
  const supabase = await createClient();
  const activeBusinesses = await getActivePublishedBusinesses(supabase);
  const business = activeBusinesses.find((item) => item.id === businessId) ?? null;

  if (!business) {
    return {
      business: null,
      events: [],
      relatedBusinesses: [],
    };
  }

  const events = await getUpcomingPublishedEvents(supabase, [business.id]);

  return {
    business: {
      ...business,
      upcoming_events: events,
    },
    events,
    relatedBusinesses: activeBusinesses
      .filter((item) => item.id !== business.id)
      .slice(0, 3),
  };
}

export async function upsertLoungeBusiness(formData: FormData) {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const membership = await getLatestMembership(adminInfo.userId);
  if (!isMembershipActive(membership)) {
    return { success: false, error: "Active lounge membership required" };
  }

  const payload = {
    owner_user_id: adminInfo.userId,
    category: (formData.get("category") as LoungeBusinessCategory) || "service",
    name: (formData.get("name") as string)?.trim(),
    tagline: ((formData.get("tagline") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    logo_url: ((formData.get("logo_url") as string) || "").trim() || null,
    cover_image_url: ((formData.get("cover_image_url") as string) || "").trim() || null,
    address: ((formData.get("address") as string) || "").trim() || null,
    phone: ((formData.get("phone") as string) || "").trim() || null,
    kakao_open_chat_url: ((formData.get("kakao_open_chat_url") as string) || "").trim() || null,
    instagram_url: ((formData.get("instagram_url") as string) || "").trim() || null,
    website_url: ((formData.get("website_url") as string) || "").trim() || null,
    is_published: formData.get("is_published") === "true",
  };

  if (!payload.name) {
    return { success: false, error: "Business name is required" };
  }

  const { data: existing } = await supabase
    .from("lounge_businesses")
    .select("id")
    .eq("owner_user_id", adminInfo.userId)
    .maybeSingle();

  const result = existing
    ? await supabase.from("lounge_businesses").update(payload).eq("id", existing.id)
    : await supabase.from("lounge_businesses").insert(payload);

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  if (existing?.id) {
    revalidatePath(`/ko/lounge/${existing.id}`);
    revalidatePath(`/en/lounge/${existing.id}`);
  }
  return { success: true };
}

export async function createLoungeEvent(formData: FormData) {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const membership = await getLatestMembership(adminInfo.userId);
  if (!isMembershipActive(membership)) {
    return { success: false, error: "Active lounge membership required" };
  }

  const { data: business } = await supabase
    .from("lounge_businesses")
    .select("id")
    .eq("owner_user_id", adminInfo.userId)
    .maybeSingle();

  if (!business) {
    return { success: false, error: "Create your lounge business first" };
  }

  const title = (formData.get("title") as string)?.trim();
  const startTimeInput = formData.get("start_time") as string;
  if (!title || !startTimeInput) {
    return { success: false, error: "Title and start time are required" };
  }

  const endTimeInput = formData.get("end_time") as string;
  const priceRaw = (formData.get("price_krw") as string) || "";
  const maxRaw = (formData.get("max_participants") as string) || "";

  const { error } = await supabase.from("lounge_events").insert({
    business_id: business.id,
    category: (formData.get("category") as LoungeEventCategory) || "promotion",
    title,
    summary: ((formData.get("summary") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    start_time: new Date(startTimeInput + "+09:00").toISOString(),
    end_time: endTimeInput ? new Date(endTimeInput + "+09:00").toISOString() : null,
    location: ((formData.get("location") as string) || "").trim() || null,
    price_krw: priceRaw ? Number(priceRaw.replace(/,/g, "")) : null,
    max_participants: maxRaw ? Number(maxRaw) : null,
    is_published: formData.get("is_published") === "true",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath(`/ko/lounge/${business.id}`);
  revalidatePath(`/en/lounge/${business.id}`);
  return { success: true };
}

export async function deleteLoungeEvent(eventId: string) {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: existingEvent } = await supabase
    .from("lounge_events")
    .select("id, business_id, lounge_businesses!inner(owner_user_id)")
    .eq("id", eventId)
    .eq("lounge_businesses.owner_user_id", adminInfo.userId)
    .maybeSingle();

  if (!existingEvent) {
    return { success: false, error: "Event not found" };
  }

  const { error } = await supabase.from("lounge_events").delete().eq("id", eventId);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath(`/ko/lounge/${existingEvent.business_id}`);
  revalidatePath(`/en/lounge/${existingEvent.business_id}`);
  return { success: true };
}

export async function upsertLoungeMembership(formData: FormData) {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = formData.get("user_id") as string;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const priceRaw = (formData.get("price_krw") as string) || "100000";
  const inquiryChannel = (formData.get("inquiry_channel") as string) || "manual";
  const note = ((formData.get("note") as string) || "").trim() || null;

  if (!userId || !startsAt || !endsAt) {
    return { success: false, error: "User, start date, and end date are required" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const endsAtDate = new Date(endsAt + "T23:59:59+09:00");
  const startsAtDate = new Date(startsAt + "T00:00:00+09:00");
  const status = endsAtDate >= new Date() ? "active" : "expired";

  const { error } = await supabase.from("lounge_memberships").insert({
    user_id: userId,
    starts_at: startsAtDate.toISOString(),
    ends_at: endsAtDate.toISOString(),
    price_krw: Number(priceRaw.replace(/,/g, "")) || 100000,
    inquiry_channel: inquiryChannel,
    note,
    status,
    created_by: user?.id ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  return { success: true };
}

export async function trackLoungeImpression(
  entityType: "business" | "event",
  businessId: string,
  eventId?: string,
  locale?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("lounge_metrics").insert({
    business_id: businessId,
    event_id: eventId ?? null,
    user_id: user?.id ?? null,
    entity_type: entityType,
    metric_type: "impression",
    locale: locale ?? null,
  });

  return { success: true };
}

export async function trackLoungeClick(
  entityType: "business" | "event",
  businessId: string,
  ctaType: LoungeCtaType,
  eventId?: string,
  locale?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("lounge_metrics").insert({
    business_id: businessId,
    event_id: eventId ?? null,
    user_id: user?.id ?? null,
    entity_type: entityType,
    metric_type: "click",
    cta_type: ctaType,
    locale: locale ?? null,
  });

  return { success: true };
}
