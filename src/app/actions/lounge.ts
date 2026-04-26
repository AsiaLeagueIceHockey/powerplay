"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeLoungeExternalUrl } from "@/lib/lounge-link-utils";
import {
  buildMetricsSummary as buildMetricsSummaryUtil,
  buildDailyMetricPoints as buildDailyMetricPointsUtil,
  buildEventMetricRows as buildEventMetricRowsUtil,
  dailyMetricsToRows,
  type DailyMetricsRow,
} from "@/lib/lounge-metrics";
import {
  compareLoungeBusinessCategoryPriority,
  type LoungeBusinessCategory,
} from "@/lib/lounge-business-category";
import { logAndNotify } from "@/lib/audit";
import { sendPushNotification } from "@/app/actions/push";
import { getAdminInfo } from "./admin-check";
import { checkIsSuperUser } from "./superuser";
import { compressImageToWebp, type ImageKind } from "@/lib/image-utils";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type { LoungeBusinessCategory } from "@/lib/lounge-business-category";

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

export interface LoungeMembershipApplication {
  id: string;
  user_id: string;
  status: "pending" | "contacted" | "converted" | "closed";
  note: string | null;
  contact_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface LoungeManagedApplication extends LoungeMembershipApplication {
  business?: {
    id: string;
    name: string;
    slug: string;
    category: LoungeBusinessCategory;
    is_published: boolean;
  } | null;
}

export interface LoungeMembershipEligibleAccount {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "superuser";
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
  slug: string;
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
  home_banner_enabled: boolean;
  home_banner_title: string | null;
  home_banner_description: string | null;
  home_banner_order: number;
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
  homeBannerImpressions: number;
  homeBannerClicks: number;
  ctaClicks: Record<LoungeCtaType, number>;
  sourceBreakdown: Record<string, number>;
}

export type LoungeMembershipPhase = "none" | "upcoming" | "active" | "expired";

export interface LoungeMetricRow {
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

export interface LoungeBusinessPerformance {
  business: LoungeBusiness;
  events: LoungeEvent[];
  metrics: LoungeMetricsSummary;
  dailyMetrics: LoungeDailyMetricPoint[];
  eventMetrics: LoungeEventMetricRow[];
  sourceMetrics: LoungeSourceMetricRow[];
  rawMetrics: LoungeMetricRow[];
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

function normalizeLoungeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeLoungeSlugParam(input: string) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

async function ensureUniqueLoungeSlug(
  supabase: SupabaseServerClient,
  slug: string,
  existingBusinessId?: string | null
) {
  const query = supabase
    .from("lounge_businesses")
    .select("id")
    .eq("slug", slug);

  const result = existingBusinessId
    ? await query.neq("id", existingBusinessId).maybeSingle()
    : await query.maybeSingle();

  return !result.data;
}

async function ensureUniqueLoungeBusinessName(
  supabase: SupabaseServerClient,
  name: string,
  existingBusinessId?: string | null
) {
  const query = supabase
    .from("lounge_businesses")
    .select("id")
    .eq("name", name);

  const result = existingBusinessId
    ? await query.neq("id", existingBusinessId).maybeSingle()
    : await query.maybeSingle();

  return !result.data;
}

function revalidateLoungePaths(slug?: string | null) {
  revalidatePath("/ko");
  revalidatePath("/en");
  revalidatePath("/ko/rinks");
  revalidatePath("/en/rinks");
  revalidatePath("/ko/clubs");
  revalidatePath("/en/clubs");
  revalidatePath("/ko/lounge");
  revalidatePath("/en/lounge");
  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath("/ko/admin/lounge-management");
  revalidatePath("/en/admin/lounge-management");

  if (slug) {
    revalidatePath(`/ko/lounge/${slug}`);
    revalidatePath(`/en/lounge/${slug}`);
  }
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

function extractJoinedSlug(
  joined:
    | { slug?: string | null }[]
    | { slug?: string | null }
    | null
    | undefined
) {
  return Array.isArray(joined) ? joined[0]?.slug ?? null : joined?.slug ?? null;
}

function formatLoungeDateTimeKst(input: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(input));
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
  const locationLatRaw = ((formData.get("location_lat") as string) || "").trim();
  const locationLngRaw = ((formData.get("location_lng") as string) || "").trim();
  const parsedLat = locationLatRaw ? Number(locationLatRaw) : null;
  const parsedLng = locationLngRaw ? Number(locationLngRaw) : null;

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
    location_lat: parsedLat !== null && Number.isFinite(parsedLat) ? parsedLat : null,
    location_lng: parsedLng !== null && Number.isFinite(parsedLng) ? parsedLng : null,
    price_krw: priceRaw ? Number(priceRaw.replace(/,/g, "")) : null,
    max_participants: maxRaw ? Number(maxRaw) : null,
    display_priority: displayPriority,
    is_published: formData.get("is_published") === "true",
  };
}

function isMembershipActive(membership: LoungeMembership | null) {
  return getLoungeMembershipPhase(membership) === "active";
}

function getLoungeMembershipPhase(membership: LoungeMembership | null): LoungeMembershipPhase {
  if (!membership || membership.status === "canceled") return "none";

  const todayKey = toKstDateKey(new Date());
  const membershipStartKey = toKstDateKey(membership.starts_at);
  const membershipEndKey = toKstDateKey(membership.ends_at);

  if (todayKey < membershipStartKey) {
    return "upcoming";
  }

  if (todayKey > membershipEndKey) {
    return "expired";
  }

  return "active";
}

const buildMetricsSummary = buildMetricsSummaryUtil;

const buildDailyMetricPoints = buildDailyMetricPointsUtil;

const buildEventMetricRows = buildEventMetricRowsUtil;

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

/**
 * Hybrid metrics fetch: lounge_daily_metrics (과거 집계) + lounge_metrics (최신 실시간)
 * - lounge_daily_metrics에서 가장 최근 집계 날짜를 확인
 * - 그 이후 데이터만 lounge_metrics에서 실시간 조회
 * - 집계 데이터가 없으면 전체 lounge_metrics에서 조회 (배치 미실행 상태에서도 동작)
 */
async function fetchMetricsHybrid(
  supabase: SupabaseServerClient,
  businessId: string
): Promise<LoungeMetricRow[]> {
  // 1. Fetch all daily aggregated metrics
  const { data: dailyData } = await supabase
    .from("lounge_daily_metrics")
    .select("business_id, date, metrics")
    .eq("business_id", businessId)
    .order("date", { ascending: true });

  const dailyRows = (dailyData as DailyMetricsRow[] | null) ?? [];

  // 2. Find the last aggregated date
  const lastAggregatedDate = dailyRows.length > 0
    ? dailyRows[dailyRows.length - 1].date
    : null;

  // 3. Convert aggregated JSONB to LoungeMetricRow[] format
  const aggregatedRows = dailyMetricsToRows(dailyRows);

  // 4. Fetch real-time metrics after the last aggregated date
  const realtimeRows: LoungeMetricRow[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    let query = supabase
      .from("lounge_metrics")
      .select("metric_type, cta_type, event_id, source, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    // Only fetch metrics after the last aggregated date (KST end of day → UTC)
    if (lastAggregatedDate) {
      query = query.gt("created_at", `${lastAggregatedDate}T14:59:59.999Z`);
    }

    const { data } = await query;
    const rows = (data as LoungeMetricRow[] | null) ?? [];
    realtimeRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // 5. Combine: aggregated (past) + realtime (recent)
  return [...aggregatedRows, ...realtimeRows];
}

async function buildLoungeBusinessPerformance(
  supabase: SupabaseServerClient,
  business: LoungeBusiness
): Promise<LoungeBusinessPerformance> {
  const [eventsResult, metricRows] = await Promise.all([
    supabase
      .from("lounge_events")
      .select("*")
      .eq("business_id", business.id)
      .order("start_time", { ascending: true }),
    fetchMetricsHybrid(supabase, business.id),
  ]);

  const events = (eventsResult.data as LoungeEvent[] | null) ?? [];

  return {
    business,
    events,
    metrics: buildMetricsSummary(metricRows),
    dailyMetrics: buildDailyMetricPoints(metricRows),
    eventMetrics: buildEventMetricRows(events, metricRows),
    sourceMetrics: buildSourceMetricRows(metricRows),
    rawMetrics: metricRows,
  };
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

async function getLatestMembershipApplication(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lounge_membership_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as LoungeMembershipApplication | null) ?? null;
}

async function getLoungeMembershipEligibleAccounts() {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .in("role", ["admin", "superuser"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lounge membership eligible accounts:", error);
    return [];
  }

  return ((data as LoungeMembershipEligibleAccount[] | null) ?? []).filter(
    (profile): profile is LoungeMembershipEligibleAccount =>
      profile.role === "admin" || profile.role === "superuser"
  );
}

async function getActivePublishedBusinesses(supabase: SupabaseServerClient) {
  const { data: businesses } = await supabase
    .from("lounge_businesses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Public SELECT on lounge_businesses is already protected by RLS:
  // only published businesses owned by users with an active lounge membership
  // are visible here. Public clients cannot read lounge_memberships directly,
  // so re-checking membership rows would incorrectly hide all data.
  return (businesses as LoungeBusiness[] | null) ?? [];
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

  const [membership, latestApplication, business, isSuperUser] = await Promise.all([
    getLatestMembership(adminInfo.userId),
    getLatestMembershipApplication(adminInfo.userId),
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

  const metricRows = businessData
    ? await fetchMetricsHybrid(supabase, businessData.id)
    : [];

  const membershipStatus = getLoungeMembershipPhase(membership);

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
    latestApplication,
    membershipStatus,
    business: businessData,
    events: (events.data as LoungeEvent[]) ?? [],
    metrics: buildMetricsSummary(metricRows),
    dailyMetrics: buildDailyMetricPoints(metricRows),
    eventMetrics: buildEventMetricRows((events.data as LoungeEvent[]) ?? [], metricRows),
    sourceMetrics: buildSourceMetricRows(metricRows),
    rawMetrics: metricRows,
    isSuperUser,
    featuredBusinesses: (featuredBusinesses?.data as LoungeBusiness[]) ?? [],
  };
}

export async function getLoungeManagementPageData(): Promise<{
  ok: boolean;
  reason?: "unauthorized";
  memberships?: LoungeManagedMembership[];
  applications?: LoungeManagedApplication[];
  admins?: LoungeMembershipEligibleAccount[];
  businesses?: LoungeBusiness[];
  performanceBusinesses?: LoungeBusinessPerformance[];
}> {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { ok: false, reason: "unauthorized" };
  }

  const [membershipsResult, applicationsResult, businessesResult, admins] = await Promise.all([
    supabase
      .from("lounge_memberships")
      .select(`
        *,
        user:user_id(id, email, full_name, phone)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("lounge_membership_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("lounge_businesses")
      .select(`
        *,
        owner:owner_user_id(id, email, full_name, phone)
      `)
      .order("created_at", { ascending: false }),
    getLoungeMembershipEligibleAccounts(),
  ]);

  const businessByOwner = new Map(
    (((businessesResult.data as LoungeBusiness[] | null) ?? [])).map((business) => [business.owner_user_id, business])
  );

  const memberships = (((membershipsResult.data as LoungeMembership[] | null) ?? [])).map((membership) => ({
    ...membership,
    business: businessByOwner.get(membership.user_id) ?? null,
  }));

  if (applicationsResult.error) {
    console.error("Error fetching lounge membership applications:", applicationsResult.error);
  }

  const rawApplications = (applicationsResult.data as LoungeMembershipApplication[] | null) ?? [];
  const applicationUserIds = Array.from(new Set(rawApplications.map((application) => application.user_id).filter(Boolean)));
  const { data: applicationProfiles, error: applicationProfilesError } = applicationUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name, phone")
        .in("id", applicationUserIds)
    : { data: [], error: null };

  if (applicationProfilesError) {
    console.error("Error fetching lounge application profiles:", applicationProfilesError);
  }

  const applicationProfileMap = new Map(
    ((applicationProfiles as Array<{ id: string; email: string | null; full_name: string | null; phone: string | null }> | null) ?? []).map((profile) => [profile.id, profile])
  );

  const applications = rawApplications.map((application) => ({
    ...application,
    user: applicationProfileMap.get(application.user_id) ?? null,
    business: businessByOwner.get(application.user_id)
      ? {
          id: businessByOwner.get(application.user_id)!.id,
          name: businessByOwner.get(application.user_id)!.name,
          slug: businessByOwner.get(application.user_id)!.slug,
          category: businessByOwner.get(application.user_id)!.category,
          is_published: businessByOwner.get(application.user_id)!.is_published,
        }
      : null,
  }));

  const activePerformanceTargets = memberships
    .filter((membership) => getLoungeMembershipPhase(membership) === "active" && membership.business)
    .map((membership) => membership.business!)
    .filter((business, index, array) => array.findIndex((item) => item.id === business.id) === index);

  const performanceBusinesses = await Promise.all(
    activePerformanceTargets.map((business) => buildLoungeBusinessPerformance(supabase, business))
  );

  return {
    ok: true,
    memberships,
    applications,
    admins,
    businesses: (businessesResult.data as LoungeBusiness[] | null) ?? [],
    performanceBusinesses: performanceBusinesses.sort((a, b) =>
      a.business.name.localeCompare(b.business.name, "ko", { sensitivity: "base" })
    ),
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
        const categoryDiff = compareLoungeBusinessCategoryPriority(a.category, b.category);
        if (categoryDiff !== 0) {
          return categoryDiff;
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

export async function getPublicHomeBannerBusinesses(): Promise<LoungeBusiness[]> {
  const supabase = await createClient();
  const activeBusinesses = await getActivePublishedBusinesses(supabase);

  return activeBusinesses
    .filter(
      (business) =>
        business.home_banner_enabled &&
        Boolean(business.home_banner_title?.trim()) &&
        Boolean(business.home_banner_description?.trim())
    )
    .sort((a, b) => {
      if (a.home_banner_order !== b.home_banner_order) {
        return a.home_banner_order - b.home_banner_order;
      }

      return a.name.localeCompare(b.name, "ko", { sensitivity: "base" });
    });
}

export async function getPublicLoungeBusinessDetail(businessSlug: string): Promise<{
  business: LoungeBusiness | null;
  events: LoungeEvent[];
  relatedBusinesses: LoungeBusiness[];
}> {
  const supabase = await createClient();
  const activeBusinesses = await getActivePublishedBusinesses(supabase);
  const requestedSlug = normalizeLoungeSlug(decodeLoungeSlugParam(businessSlug));
  const business =
    activeBusinesses.find((item) => item.slug === requestedSlug || item.slug === businessSlug) ?? null;

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
        const categoryDiff = compareLoungeBusinessCategoryPriority(a.category, b.category);
        if (categoryDiff !== 0) {
          return categoryDiff;
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
    .select("id, slug, name, is_published, display_priority")
    .eq("owner_user_id", adminInfo.userId)
    .maybeSingle();

  const name = (formData.get("name") as string)?.trim();
  const slugInput = ((formData.get("slug") as string) || "").trim();
  const slug = normalizeLoungeSlug(slugInput || name || "");

  const payload = {
    owner_user_id: adminInfo.userId,
    slug,
    category: (formData.get("category") as LoungeBusinessCategory) || "service",
    name,
    tagline: ((formData.get("tagline") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    logo_url: ((formData.get("logo_url") as string) || "").trim() || null,
    cover_image_url: ((formData.get("cover_image_url") as string) || "").trim() || null,
    address: ((formData.get("address") as string) || "").trim() || null,
    map_url: ((formData.get("map_url") as string) || "").trim() || null,
    lat: ((formData.get("lat") as string) || "").trim() ? Number(formData.get("lat")) : null,
    lng: ((formData.get("lng") as string) || "").trim() ? Number(formData.get("lng")) : null,
    phone: ((formData.get("phone") as string) || "").trim() || null,
    kakao_open_chat_url: null as string | null,
    instagram_url: null as string | null,
    website_url: null as string | null,
    display_priority: formData.has("display_priority")
      ? Number((formData.get("display_priority") as string) || "0") || 0
      : existing?.display_priority ?? 0,
    is_published: formData.get("is_published") === "true",
  };

  if (!payload.name) {
    return { success: false, error: "Business name is required" };
  }

  if (!slug) {
    return { success: false, error: "Business slug is required" };
  }

  const nameAvailable = await ensureUniqueLoungeBusinessName(supabase, payload.name, existing?.id ?? null);
  if (!nameAvailable) {
    return { success: false, error: "이미 사용 중인 비즈니스명입니다. 다른 이름을 입력해주세요." };
  }

  const kakaoUrl = sanitizeLoungeExternalUrl(formData.get("kakao_open_chat_url") as string | null, "kakao");
  if (kakaoUrl.error) {
    return { success: false, error: "카카오 링크는 https://open.kakao.com 또는 pf.kakao.com 형식이어야 합니다." };
  }

  const instagramUrl = sanitizeLoungeExternalUrl(formData.get("instagram_url") as string | null, "instagram");
  if (instagramUrl.error) {
    return { success: false, error: "인스타그램은 instagram.com 주소 또는 @아이디 형식으로 입력해주세요." };
  }

  const websiteUrl = sanitizeLoungeExternalUrl(formData.get("website_url") as string | null, "website");
  if (websiteUrl.error) {
    return { success: false, error: "웹사이트 링크는 http:// 또는 https:// 로 시작해야 합니다." };
  }

  payload.kakao_open_chat_url = kakaoUrl.value;
  payload.instagram_url = instagramUrl.value;
  payload.website_url = websiteUrl.value;

  const slugAvailable = await ensureUniqueLoungeSlug(supabase, slug, existing?.id ?? null);
  if (!slugAvailable) {
    return { success: false, error: "이미 사용 중인 공유 URL입니다. 다른 이름을 입력해주세요." };
  }

  const result = existing
    ? await supabase.from("lounge_businesses").update(payload).eq("id", existing.id)
    : await supabase.from("lounge_businesses").insert(payload);

  if (result.error) {
    if (
      (payload.category === "other" || payload.category === "youth_club") &&
      (result.error.message.includes("lounge_businesses_category_check") ||
        result.error.message.includes("violates check constraint"))
    ) {
      return {
        success: false,
        error: "DB에 v40_lounge_business_category_youth_club.sql 이 아직 적용되지 않았습니다. 적용 후 다시 저장해주세요.",
      };
    }
    return { success: false, error: result.error.message };
  }

  const isCreate = !existing;
  const publishChanged = existing ? existing.is_published !== payload.is_published : payload.is_published;
  const action = isCreate
    ? "LOUNGE_BUSINESS_CREATE"
    : publishChanged
      ? "LOUNGE_BUSINESS_PUBLISH"
      : "LOUNGE_BUSINESS_UPDATE";

  await logAndNotify({
    userId: adminInfo.userId,
    action,
    description: isCreate
      ? `라운지 비즈니스 '${payload.name}'를 등록했습니다.`
      : publishChanged
        ? `라운지 비즈니스 '${payload.name}' 공개 상태를 ${payload.is_published ? "공개" : "비공개"}로 변경했습니다.`
        : `라운지 비즈니스 '${payload.name}' 정보를 수정했습니다.`,
    metadata: {
      businessId: existing?.id ?? null,
      businessName: payload.name,
      businessSlug: slug,
      category: payload.category,
      isPublished: payload.is_published,
    },
    skipPush: !(isCreate || publishChanged),
    url: `/ko/admin/lounge`,
  });

  revalidateLoungePaths(existing?.slug ?? null);
  revalidateLoungePaths(slug);
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
    .select("id, slug, name")
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
        .select("id, title, start_time, is_published, display_priority")
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

  const isCreate = !eventId;
  await logAndNotify({
    userId: adminInfo.userId,
    action: isCreate ? "LOUNGE_EVENT_CREATE" : "LOUNGE_EVENT_UPDATE",
    description: isCreate
      ? `라운지 일정 '${payload.title}'를 등록했습니다. (${business.name}, ${formatLoungeDateTimeKst(payload.start_time)})`
      : `라운지 일정 '${payload.title}'를 수정했습니다. (${business.name}, ${formatLoungeDateTimeKst(payload.start_time)})`,
    metadata: {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      eventId: eventId || null,
      eventTitle: payload.title,
      category: payload.category,
      isPublished: payload.is_published,
      startTime: payload.start_time,
    },
    skipPush: !isCreate,
    url: `/ko/admin/lounge`,
  });

  revalidateLoungePaths(business.slug);
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
    .select("id, slug, name")
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

  await logAndNotify({
    userId: adminInfo.userId,
    action: "LOUNGE_EVENT_BULK_CREATE",
    description: `라운지 반복 일정 ${rows.length}건을 등록했습니다. (${business.name}, ${selectedDates[0]} ~ ${selectedDates[selectedDates.length - 1]})`,
    metadata: {
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      count: rows.length,
      title,
      startDate: selectedDates[0],
      endDate: selectedDates[selectedDates.length - 1],
      category: rows[0]?.category ?? null,
    },
    url: `/ko/admin/lounge`,
  });

  revalidateLoungePaths(business.slug);
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
    .select("id, title, start_time, business_id, lounge_businesses!inner(owner_user_id, slug, name)")
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

  const businessSlug = (existingEvent as {
    lounge_businesses?:
      | { slug?: string | null; name?: string | null }[]
      | { slug?: string | null; name?: string | null }
      | null;
  }).lounge_businesses;
  const resolvedSlug = extractJoinedSlug(businessSlug);
  const resolvedBusinessName = Array.isArray(businessSlug)
    ? businessSlug[0]?.name ?? null
    : businessSlug?.name ?? null;

  await logAndNotify({
    userId: adminInfo.userId,
    action: "LOUNGE_EVENT_DELETE",
    description: `라운지 일정 '${(existingEvent as { title?: string | null }).title ?? "이름 없는 일정"}'를 삭제했습니다.${resolvedBusinessName ? ` (${resolvedBusinessName})` : ""}${(existingEvent as { start_time?: string | null }).start_time ? ` (${formatLoungeDateTimeKst((existingEvent as { start_time?: string | null }).start_time as string)})` : ""}`,
    metadata: {
      businessId: (existingEvent as { business_id: string }).business_id,
      businessName: resolvedBusinessName,
      businessSlug: resolvedSlug,
      eventId,
      eventTitle: (existingEvent as { title?: string | null }).title ?? null,
      startTime: (existingEvent as { start_time?: string | null }).start_time ?? null,
    },
    skipPush: true,
    url: `/ko/admin/lounge`,
  });

  revalidateLoungePaths(resolvedSlug ?? null);
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

  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (targetProfileError) {
    return { success: false, error: targetProfileError.message };
  }

  if (!targetProfile || !["admin", "superuser"].includes(targetProfile.role)) {
    return {
      success: false,
      error: "라운지 구독은 admin 또는 superuser 권한 계정에만 등록할 수 있습니다.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const endsAtDate = new Date(endsAt + "T23:59:59+09:00");
  const startsAtDate = new Date(startsAt + "T00:00:00+09:00");
  const todayKey = toKstDateKey(new Date());
  const endsAtKey = toKstDateKey(endsAtDate);
  const status = todayKey > endsAtKey ? "expired" : "active";

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

  await supabase
    .from("lounge_membership_applications")
    .update({
      status: "converted",
      handled_by: user?.id ?? null,
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("status", ["pending", "contacted"]);

  await logAndNotify({
    userId: user?.id ?? userId,
    action: "LOUNGE_MEMBERSHIP_SAVE",
    description: membershipId
      ? `라운지 구독 계약을 수정했습니다. (${startsAt} ~ ${endsAt})`
      : `라운지 구독 계약을 등록했습니다. (${startsAt} ~ ${endsAt})`,
    metadata: {
      membershipId: membershipId || null,
      targetUserId: userId,
      startsAt,
      endsAt,
      priceKrw: payload.price_krw,
      inquiryChannel: inquiryChannel || null,
      status: payload.status,
    },
    skipPush: true,
    url: `/ko/admin/lounge-management`,
  });

  try {
    await sendPushNotification(
      userId,
      membershipId
        ? "파워플레이 라운지 멤버십 변경 안내 🏆"
        : "파워플레이 라운지 멤버십 활성화 🏆",
      membershipId
        ? `라운지 프리미엄 멤버십 기간이 ${startsAt} ~ ${endsAt} 로 업데이트되었습니다. 관리자 페이지에서 바로 확인해보세요.`
        : `라운지 프리미엄 멤버십이 ${startsAt} ~ ${endsAt} 동안 활성화되었습니다. 관리자 페이지에서 바로 이용하실 수 있습니다.`,
      "/ko/admin/lounge"
    );
  } catch (pushError) {
    console.error("Failed to send lounge membership push:", pushError);
  }

  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath("/ko/admin/lounge-management");
  revalidatePath("/en/admin/lounge-management");
  return { success: true };
}

export async function submitLoungeMembershipApplication(formData: FormData) {
  const supabase = await createClient();
  const adminInfo = await getAdminInfo();

  if (!adminInfo.isAdmin || !adminInfo.userId) {
    return { success: false, error: "Unauthorized" };
  }

  const membership = await getLatestMembership(adminInfo.userId);
  if (isMembershipActive(membership)) {
    return { success: false, error: "Already active" };
  }

  const existingPending = await supabase
    .from("lounge_membership_applications")
    .select("id, status")
    .eq("user_id", adminInfo.userId)
    .in("status", ["pending", "contacted"])
    .maybeSingle();

  if (existingPending.data) {
    return { success: false, error: "이미 처리 중인 멤버십 신청이 있습니다." };
  }

  const note = ((formData.get("note") as string) || "").trim() || null;

  const { error } = await supabase.from("lounge_membership_applications").insert({
    user_id: adminInfo.userId,
    note,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAndNotify({
    userId: adminInfo.userId,
    action: "LOUNGE_APPLICATION_CREATE",
    description: "라운지 프리미엄 멤버십을 신청했습니다.",
    metadata: {
      note,
      applicationStatus: "pending",
    },
    url: "/ko/admin/lounge-management",
  });

  revalidatePath("/ko/admin/lounge");
  revalidatePath("/en/admin/lounge");
  revalidatePath("/ko/admin/lounge-management");
  revalidatePath("/en/admin/lounge-management");
  return { success: true };
}

export async function updateLoungeMembershipApplicationStatus(formData: FormData) {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const applicationId = ((formData.get("application_id") as string) || "").trim();
  const status = ((formData.get("status") as string) || "").trim() as LoungeMembershipApplication["status"];
  const contactNote = ((formData.get("contact_note") as string) || "").trim() || null;

  if (!applicationId || !["pending", "contacted", "converted", "closed"].includes(status)) {
    return { success: false, error: "Invalid application update" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application, error: applicationError } = await supabase
    .from("lounge_membership_applications")
    .select("id, user_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    return { success: false, error: "Application not found" };
  }

  const { error } = await supabase
    .from("lounge_membership_applications")
    .update({
      status,
      contact_note: contactNote,
      handled_by: user?.id ?? null,
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAndNotify({
    userId: user?.id ?? application.user_id,
    action: "LOUNGE_APPLICATION_UPDATE",
    description: `라운지 멤버십 신청 상태를 '${status}'로 변경했습니다.`,
    metadata: {
      applicationId,
      targetUserId: application.user_id,
      previousStatus: application.status,
      status,
      contactNote,
    },
    skipPush: true,
    url: "/ko/admin/lounge-management",
  });

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

  // 호출부에서 logo/cover 구분 전달. 기본값은 logo.
  const rawKind = formData.get("kind");
  const kind: ImageKind = rawKind === "cover" ? "cover" : "logo";

  let compressed: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    compressed = await compressImageToWebp(inputBuffer, kind);
  } catch (compressError) {
    console.error("Image compression error:", compressError);
    return { error: "Failed to process image" };
  }

  // 항상 WebP 확장자로 통일
  const fileName = `lounge/${adminInfo.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("club-logos")
    .upload(fileName, compressed, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/webp",
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isFeatured = formData.has("is_featured");
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

  const { data: business } = await supabase
    .from("lounge_businesses")
    .select("slug, name, owner_user_id")
    .eq("id", businessId)
    .maybeSingle();

  await logAndNotify({
    userId: user?.id ?? business?.owner_user_id ?? businessId,
    action: "LOUNGE_FEATURE_UPDATE",
    description: business?.name
      ? `추천 비즈니스 노출 설정을 변경했습니다. (${business.name})`
      : "추천 비즈니스 노출 설정을 변경했습니다.",
    metadata: {
      businessId,
      businessName: business?.name ?? null,
      businessSlug: business?.slug ?? null,
      isFeatured,
      featuredOrder: isFeatured ? featuredOrder : 0,
    },
    skipPush: true,
    url: `/ko/admin/lounge-management`,
  });

  revalidateLoungePaths(business?.slug ?? null);
  return { success: true };
}

export async function updateLoungeBusinessHomeBanner(formData: FormData) {
  const supabase = await createClient();
  const isSuperUser = await checkIsSuperUser();

  if (!isSuperUser) {
    return { success: false, error: "Unauthorized" };
  }

  const businessId = (formData.get("business_id") as string) || "";
  if (!businessId) {
    return { success: false, error: "Business is required" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const homeBannerEnabled = formData.has("home_banner_enabled");
  const homeBannerTitle = ((formData.get("home_banner_title") as string) || "").trim();
  const homeBannerDescription = ((formData.get("home_banner_description") as string) || "").trim();
  const homeBannerOrderRaw = (formData.get("home_banner_order") as string) || "0";
  const homeBannerOrder = Math.max(0, Number(homeBannerOrderRaw) || 0);

  if (homeBannerEnabled && (!homeBannerTitle || !homeBannerDescription)) {
    return {
      success: false,
      error: "배너 노출을 켜려면 배너 타이틀과 소개 문구를 모두 입력해주세요.",
    };
  }

  const { error } = await supabase
    .from("lounge_businesses")
    .update({
      home_banner_enabled: homeBannerEnabled,
      home_banner_title: homeBannerTitle || null,
      home_banner_description: homeBannerDescription || null,
      home_banner_order: homeBannerEnabled ? homeBannerOrder : 0,
    })
    .eq("id", businessId);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: business } = await supabase
    .from("lounge_businesses")
    .select("slug, name, owner_user_id")
    .eq("id", businessId)
    .maybeSingle();

  await logAndNotify({
    userId: user?.id ?? business?.owner_user_id ?? businessId,
    action: "LOUNGE_HOME_BANNER_UPDATE",
    description: business?.name
      ? `홈 배너 노출 설정을 변경했습니다. (${business.name})`
      : "홈 배너 노출 설정을 변경했습니다.",
    metadata: {
      businessId,
      businessName: business?.name ?? null,
      businessSlug: business?.slug ?? null,
      homeBannerEnabled,
      homeBannerOrder: homeBannerEnabled ? homeBannerOrder : 0,
      homeBannerTitle: homeBannerTitle || null,
      homeBannerDescription: homeBannerDescription || null,
    },
    skipPush: true,
    url: `/ko/admin/lounge-management`,
  });

  revalidateLoungePaths(business?.slug ?? null);
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

  const { error } = await supabase.from("lounge_metrics").insert({
    business_id: businessId,
    event_id: eventId ?? null,
    user_id: user?.id ?? null,
    entity_type: entityType,
    metric_type: "impression",
    locale: locale ?? null,
    source: source ?? null,
  });

  if (error) {
    console.error("Failed to track lounge impression", {
      businessId,
      eventId,
      entityType,
      locale,
      source,
      error: error.message,
    });
    return { success: false, error: error.message };
  }

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

  const { error } = await supabase.from("lounge_metrics").insert({
    business_id: businessId,
    event_id: eventId ?? null,
    user_id: user?.id ?? null,
    entity_type: entityType,
    metric_type: "click",
    cta_type: ctaType,
    locale: locale ?? null,
    source: source ?? null,
  });

  if (error) {
    console.error("Failed to track lounge click", {
      businessId,
      eventId,
      entityType,
      ctaType,
      locale,
      source,
      error: error.message,
    });
    return { success: false, error: error.message };
  }

  return { success: true };
}
