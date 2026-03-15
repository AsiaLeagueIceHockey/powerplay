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
    phone: string | null;
  } | null;
}

export interface LoungeManagedMembership extends LoungeMembership {
  business?: {
    id: string;
    name: string;
    category: LoungeBusinessCategory;
    is_published: boolean;
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
  location_address: string | null;
  location_map_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  price_krw: number | null;
  max_participants: number | null;
  display_priority: number;
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
  map_url: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  kakao_open_chat_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  display_priority: number;
  is_featured: boolean;
  featured_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  upcoming_events?: LoungeEvent[];
  owner?: {
    id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface LoungeMetricsSummary {
  businessImpressions: number;
  businessClicks: number;
  eventImpressions: number;
  eventClicks: number;
  ctaClicks: Record<LoungeCtaType, number>;
  sourceBreakdown: Record<string, number>;
}

interface LoungeMetricRow {
  metric_type: "impression" | "click";
  cta_type: LoungeCtaType | null;
  event_id: string | null;
  source: string | null;
  created_at: string;
}

export interface LoungeDailyMetricPoint {
  date: string;
  impressions: number;
  clicks: number;
}

export interface LoungeEventMetricRow {
  eventId: string;
  title: string;
  startTime: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface LoungeSourceMetricRow {
  source: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface LoungeEventPayload {
  business_id: string;
  category: LoungeEventCategory;
  title: string;
  summary: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  location_address: string | null;
  location_map_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  price_krw: number | null;
  max_participants: number | null;
  display_priority: number;
  is_published: boolean;
}

function toKstDateKey(input: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function buildLoungeEventPayload(
  businessId: string,
  formData: FormData,
  startTimeIso: string,
  endTimeIso: string | null,
  displayPriority = 0
): LoungeEventPayload {
  const priceRaw = (formData.get("price_krw") as string) || "";
  const maxRaw = (formData.get("max_participants") as string) || "";

  return {
    business_id: businessId,
    category: (formData.get("category") as LoungeEventCategory) || "promotion",
    title: ((formData.get("title") as string) || "").trim(),
    summary: ((formData.get("summary") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    start_time: startTimeIso,
    end_time: endTimeIso,
    location: ((formData.get("location") as string) || "").trim() || null,
    location_address: ((formData.get("location_address") as string) || "").trim() || null,
    location_map_url: ((formData.get("location_map_url") as string) || "").trim() || null,
    location_lat: ((formData.get("location_lat") as string) || "").trim() ? Number(formData.get("location_lat")) : null,
    location_lng: ((formData.get("location_lng") as string) || "").trim() ? Number(formData.get("location_lng")) : null,
    price_krw: priceRaw ? Number(priceRaw.replace(/,/g, "")) : null,
    max_participants: maxRaw ? Number(maxRaw) : null,
    display_priority: displayPriority,
    is_published: formData.get("is_published") === "true",
  };
}

function isMembershipActive(membership: LoungeMembership | null) {
  if (!membership || membership.status === "canceled") return false;
  const now = new Date();
  return new Date(membership.starts_at) <= now && new Date(membership.ends_at) >= now;
}

function buildMetricsSummary(rows: LoungeMetricRow[]): LoungeMetricsSummary {
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
    sourceBreakdown: {},
  };

  rows.forEach((row) => {
    const isEvent = !!row.event_id;

    if (row.source) {
      summary.sourceBreakdown[row.source] = (summary.sourceBreakdown[row.source] ?? 0) + 1;
    }

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

function buildDailyMetricPoints(rows: LoungeMetricRow[]): LoungeDailyMetricPoint[] {
  const map = new Map<string, LoungeDailyMetricPoint>();

  rows.forEach((row) => {
    const dateKey = row.created_at.slice(0, 10);
    const current = map.get(dateKey) ?? {
      date: dateKey,
      impressions: 0,
      clicks: 0,
    };

    if (row.metric_type === "impression") current.impressions += 1;
    else current.clicks += 1;

    map.set(dateKey, current);
  });

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
}

function buildEventMetricRows(events: LoungeEvent[], rows: LoungeMetricRow[]): LoungeEventMetricRow[] {
  const map = new Map<string, LoungeEventMetricRow>();

  events.forEach((event) => {
    map.set(event.id, {
      eventId: event.id,
      title: event.title,
      startTime: event.start_time,
      impressions: 0,
      clicks: 0,
      ctr: 0,
    });
  });

  rows.forEach((row) => {
    if (!row.event_id) return;
    const current = map.get(row.event_id);
    if (!current) return;

    if (row.metric_type === "impression") current.impressions += 1;
    else current.clicks += 1;
  });

  return [...map.values()]
    .map((item) => ({
      ...item,
      ctr: item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.impressions !== a.impressions) return b.impressions - a.impressions;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
}

function buildSourceMetricRows(rows: LoungeMetricRow[]): LoungeSourceMetricRow[] {
  const map = new Map<string, LoungeSourceMetricRow>();

  rows.forEach((row) => {
    const sourceKey = row.source ?? "unknown";
    const current = map.get(sourceKey) ?? {
      source: sourceKey,
      impressions: 0,
      clicks: 0,
      ctr: 0,
    };

    if (row.metric_type === "impression") current.impressions += 1;
    else current.clicks += 1;

    map.set(sourceKey, current);
  });

  return [...map.values()]
    .map((item) => ({
      ...item,
      ctr: item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.impressions !== a.impressions) return b.impressions - a.impressions;
      return a.source.localeCompare(b.source);
    });
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

  const todayKeyKst = toKstDateKey(new Date());

  return ((events as LoungeEvent[] | null) ?? []).filter(
    (event) => toKstDateKey(event.start_time) >= todayKeyKst
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
        .select("metric_type, cta_type, event_id, source, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false })
        .limit(1000)
    : { data: [] as LoungeMetricRow[] };

  const metricRows = (metrics.data as LoungeMetricRow[] | null) ?? [];

  const membershipStatus = !membership ? "none" : isMembershipActive(membership) ? "active" : "expired";

  const featuredBusinesses = isSuperUser
    ? await supabase
        .from("lounge_businesses")
        .select(`
          *,
          owner:owner_user_id(id, email, full_name, phone)
        `)
        .order("created_at", { ascending: false })
    : null;

  return {
    ok: true,
    reason: null,
    membership,
    membershipStatus,
    business: businessData,
    events: (events.data as LoungeEvent[]) ?? [],
    metrics: buildMetricsSummary(metricRows),
    dailyMetrics: buildDailyMetricPoints(metricRows),
    eventMetrics: buildEventMetricRows((events.data as LoungeEvent[]) ?? [], metricRows),
    sourceMetrics: buildSourceMetricRows(metricRows),
    isSuperUser,
    featuredBusinesses: (featuredBusinesses?.data as LoungeBusiness[]) ?? [],
  };
}

export async function getLoungeManagementPageData(): Promise<{
  ok: boolean;
  reason?: "unauthorized";
  memberships?: LoungeManagedMembership[];
  admins?: Awaited<ReturnType<typeof getAdmins>>;
}> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { ok: false, reason: "unauthorized" };
  }

  const [membershipsResult, businessesResult, admins] = await Promise.all([
    supabase
      .from("lounge_memberships")
      .select(`
        *,
        user:user_id(id, email, full_name, phone)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("lounge_businesses")
      .select("id, owner_user_id, name, category, is_published")
      .order("created_at", { ascending: false }),
    getAdmins(),
  ]);

  const businessByOwner = new Map(
    (((businessesResult.data as Array<{
      id: string;
      owner_user_id: string;
      name: string;
      category: LoungeBusinessCategory;
      is_published: boolean;
    }> | null) ?? [])).map((business) => [business.owner_user_id, business])
  );

  const memberships = (((membershipsResult.data as LoungeMembership[] | null) ?? [])).map((membership) => ({
    ...membership,
    business: businessByOwner.get(membership.user_id) ?? null,
  }));

  return {
    ok: true,
    memberships,
    admins,
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
    businesses: activeBusinesses
      .map((business) => ({
        ...business,
        upcoming_events: eventsByBusiness.get(business.id) ?? [],
      }))
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        if (a.is_featured && b.is_featured && a.featured_order !== b.featured_order) {
          return a.featured_order - b.featured_order;
        }
        const eventDiff = (b.upcoming_events?.length ?? 0) - (a.upcoming_events?.length ?? 0);
        if (eventDiff !== 0) {
          return eventDiff;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
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
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        if (a.is_featured && b.is_featured && a.featured_order !== b.featured_order) {
          return a.featured_order - b.featured_order;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
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

  const { data: existing } = await supabase
    .from("lounge_businesses")
    .select("id, display_priority")
    .eq("owner_user_id", adminInfo.userId)
    .maybeSingle();

  const payload = {
    owner_user_id: adminInfo.userId,
    category: (formData.get("category") as LoungeBusinessCategory) || "service",
    name: (formData.get("name") as string)?.trim(),
    tagline: ((formData.get("tagline") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    logo_url: ((formData.get("logo_url") as string) || "").trim() || null,
    cover_image_url: ((formData.get("cover_image_url") as string) || "").trim() || null,
    address: ((formData.get("address") as string) || "").trim() || null,
    map_url: ((formData.get("map_url") as string) || "").trim() || null,
    lat: ((formData.get("lat") as string) || "").trim() ? Number(formData.get("lat")) : null,
    lng: ((formData.get("lng") as string) || "").trim() ? Number(formData.get("lng")) : null,
    phone: ((formData.get("phone") as string) || "").trim() || null,
    kakao_open_chat_url: ((formData.get("kakao_open_chat_url") as string) || "").trim() || null,
    instagram_url: ((formData.get("instagram_url") as string) || "").trim() || null,
    website_url: ((formData.get("website_url") as string) || "").trim() || null,
    display_priority: formData.has("display_priority")
      ? Number((formData.get("display_priority") as string) || "0") || 0
      : existing?.display_priority ?? 0,
    is_published: formData.get("is_published") === "true",
  };

  if (!payload.name) {
    return { success: false, error: "Business name is required" };
  }

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

export async function upsertLoungeEvent(formData: FormData) {
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
  const eventId = ((formData.get("event_id") as string) || "").trim();
  const startTimeInput = formData.get("start_time") as string;
  if (!title || !startTimeInput) {
    return { success: false, error: "Title and start time are required" };
  }

  const endTimeInput = formData.get("end_time") as string;
  const existingEvent = eventId
    ? await supabase
        .from("lounge_events")
        .select("id, display_priority")
        .eq("id", eventId)
        .eq("business_id", business.id)
        .maybeSingle()
    : { data: null as Pick<LoungeEvent, "id" | "display_priority"> | null };

  const payload = buildLoungeEventPayload(
    business.id,
    formData,
    new Date(startTimeInput + "+09:00").toISOString(),
    endTimeInput ? new Date(endTimeInput + "+09:00").toISOString() : null,
    formData.has("display_priority")
      ? Number((formData.get("display_priority") as string) || "0") || 0
      : existingEvent.data?.display_priority ?? 0
  );

  const { error } = eventId
    ? await supabase
        .from("lounge_events")
        .update(payload)
        .eq("id", eventId)
        .eq("business_id", business.id)
    : await supabase.from("lounge_events").insert(payload);

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

export async function createBulkLoungeEvents(formData: FormData) {
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

  const title = ((formData.get("title") as string) || "").trim();
  const startTimeOfDay = ((formData.get("start_time_of_day") as string) || "").trim();
  const endTimeOfDay = ((formData.get("end_time_of_day") as string) || "").trim();
  const selectedDatesRaw = ((formData.get("selected_dates") as string) || "").trim();

  if (!title || !startTimeOfDay || !selectedDatesRaw) {
    return { success: false, error: "Title, time, and selected dates are required" };
  }

  let selectedDates: string[] = [];
  try {
    const parsed = JSON.parse(selectedDatesRaw);
    if (!Array.isArray(parsed)) {
      return { success: false, error: "Invalid selected dates payload" };
    }
    selectedDates = parsed.filter((value): value is string => typeof value === "string").sort();
  } catch {
    return { success: false, error: "Invalid selected dates payload" };
  }

  if (selectedDates.length === 0) {
    return { success: false, error: "No dates selected" };
  }

  const membershipStartKey = toKstDateKey(membership!.starts_at);
  const membershipEndKey = toKstDateKey(membership!.ends_at);
  const invalidDate = selectedDates.find((dateKey) => dateKey < membershipStartKey || dateKey > membershipEndKey);
  if (invalidDate) {
    return { success: false, error: "Selected dates must stay within the membership period" };
  }

  const { data: existingEvents } = await supabase
    .from("lounge_events")
    .select("display_priority")
    .eq("business_id", business.id)
    .order("display_priority", { ascending: false })
    .limit(1);

  const basePriority = existingEvents?.[0]?.display_priority ?? 0;

  const rows = selectedDates.map((dateKey, index) => {
    const startTimeIso = new Date(`${dateKey}T${startTimeOfDay}+09:00`).toISOString();
    const endTimeIso = endTimeOfDay
      ? new Date(`${dateKey}T${endTimeOfDay}+09:00`).toISOString()
      : null;

    return buildLoungeEventPayload(
      business.id,
      formData,
      startTimeIso,
      endTimeIso,
      basePriority + index + 1
    );
  });

  const { error } = await supabase.from("lounge_events").insert(rows);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath(`/ko/lounge/${business.id}`);
  revalidatePath(`/en/lounge/${business.id}`);
  return { success: true, count: rows.length };
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

  const membershipId = (formData.get("membership_id") as string) || "";
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

  const payload = {
    user_id: userId,
    starts_at: startsAtDate.toISOString(),
    ends_at: endsAtDate.toISOString(),
    price_krw: Number(priceRaw.replace(/,/g, "")) || 100000,
    inquiry_channel: inquiryChannel,
    note,
    status,
  };

  const { error } = membershipId
    ? await supabase
        .from("lounge_memberships")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membershipId)
    : await supabase.from("lounge_memberships").insert({
        ...payload,
        created_by: user?.id ?? null,
      });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath("/ko/admin/lounge-management");
  revalidatePath("/en/admin/lounge-management");
  return { success: true };
}

export async function uploadLoungeImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be 5MB or less" };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `lounge/${adminInfo.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("club-logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("club-logos").getPublicUrl(fileName);

  return { url: publicUrl };
}

export async function updateLoungeBusinessFeature(formData: FormData) {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const businessId = (formData.get("business_id") as string) || "";
  if (!businessId) {
    return { success: false, error: "Business is required" };
  }

  const isFeatured = formData.get("is_featured") === "true";
  const featuredOrderRaw = (formData.get("featured_order") as string) || "0";
  const featuredOrder = Math.max(0, Number(featuredOrderRaw) || 0);

  const { error } = await supabase
    .from("lounge_businesses")
    .update({
      is_featured: isFeatured,
      featured_order: isFeatured ? featuredOrder : 0,
    })
    .eq("id", businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath(`/ko/lounge/${businessId}`);
  revalidatePath(`/en/lounge/${businessId}`);
  return { success: true };
}

export async function trackLoungeImpression(
  entityType: "business" | "event",
  businessId: string,
  eventId?: string,
  locale?: string,
  source?: string
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
    source: source ?? null,
  });

  return { success: true };
}

export async function trackLoungeClick(
  entityType: "business" | "event",
  businessId: string,
  ctaType: LoungeCtaType,
  eventId?: string,
  locale?: string,
  source?: string
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
    source: source ?? null,
  });

  return { success: true };
}
