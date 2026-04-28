import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

import type { LoungeBusiness, LoungeEvent } from "@/app/actions/lounge";

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function toKstDateKey(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function fetchPublicLoungeData(): Promise<{
  businesses: LoungeBusiness[];
  events: LoungeEvent[];
}> {
  const supabase = createPublicSupabaseClient();

  const { data: businesses } = await supabase
    .from("lounge_businesses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const businessList = (businesses as LoungeBusiness[] | null) ?? [];
  if (businessList.length === 0) return { businesses: [], events: [] };

  const { data: events } = await supabase
    .from("lounge_events")
    .select("*")
    .in(
      "business_id",
      businessList.map((b) => b.id)
    )
    .eq("is_published", true)
    .order("start_time", { ascending: true });

  const todayKey = toKstDateKey(new Date());
  const upcomingEvents = ((events as LoungeEvent[] | null) ?? []).filter(
    (event) => toKstDateKey(event.start_time) >= todayKey
  );

  const eventsByBusiness = new Map<string, LoungeEvent[]>();
  for (const event of upcomingEvents) {
    const list = eventsByBusiness.get(event.business_id) ?? [];
    list.push(event);
    eventsByBusiness.set(event.business_id, list);
  }

  return {
    businesses: businessList
      .map((b) => ({ ...b, upcoming_events: eventsByBusiness.get(b.id) ?? [] }))
      .sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return (a.featured_order ?? 0) - (b.featured_order ?? 0);
      }),
    events: upcomingEvents,
  };
}

export const getPublicLoungeData = unstable_cache(
  fetchPublicLoungeData,
  ["seo-public-lounge-data"],
  { revalidate: 600, tags: ["lounge"] }
);

export const getPublicLoungeBusinessSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const { businesses } = await fetchPublicLoungeData();
    return businesses.map((b) => b.slug).filter(Boolean);
  },
  ["seo-public-lounge-slugs"],
  { revalidate: 3600, tags: ["lounge"] }
);

export const getPublicLoungeBusinessBySlug = unstable_cache(
  async (
    slug: string
  ): Promise<{
    business: LoungeBusiness | null;
    events: LoungeEvent[];
    relatedBusinesses: LoungeBusiness[];
  }> => {
    const { businesses } = await fetchPublicLoungeData();
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }
    const business =
      businesses.find((b) => b.slug === slug || b.slug === decodedSlug) ?? null;
    if (!business) {
      return { business: null, events: [], relatedBusinesses: [] };
    }
    return {
      business,
      events: business.upcoming_events ?? [],
      relatedBusinesses: businesses.filter((b) => b.id !== business.id).slice(0, 6),
    };
  },
  ["seo-public-lounge-business-by-slug"],
  { revalidate: 600, tags: ["lounge"] }
);
