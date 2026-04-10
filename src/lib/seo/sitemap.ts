import { createServerClient } from "@supabase/ssr";
import { MetadataRoute } from "next";

export const SEO_BASE_URL = "https://powerplay.kr";
export const SEO_LOCALES = ["ko", "en"] as const;
export const NAVER_SITEMAP_LOCALES = ["ko"] as const;

const MAX_INDEXED_MATCHES = 60;
const STATIC_PAGES = [
  { path: "", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/rinks", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/clubs", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/lounge", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
];

type SitemapLocale = (typeof SEO_LOCALES)[number];

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function getStaticEntries(locales: readonly SitemapLocale[]): MetadataRoute.Sitemap {
  return STATIC_PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SEO_BASE_URL}/${locale}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );
}

export async function buildSitemapEntries(
  locales: readonly SitemapLocale[]
): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient();
  const staticEntries = getStaticEntries(locales);

  let clubEntries: MetadataRoute.Sitemap = [];
  let rinkEntries: MetadataRoute.Sitemap = [];
  let loungeEntries: MetadataRoute.Sitemap = [];
  let matchEntries: MetadataRoute.Sitemap = [];

  try {
    const nowIso = new Date().toISOString();
    const [clubsResult, rinksResult, loungeBusinessesResult, matchesResult] = await Promise.all([
      supabase.from("clubs").select("id, updated_at"),
      supabase
        .from("rinks")
        .select("id, updated_at")
        .eq("is_approved", true)
        .order("name_ko", { ascending: true }),
      supabase
        .from("lounge_businesses")
        .select("slug, updated_at, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("id, start_time, status, updated_at")
        .eq("status", "open")
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(MAX_INDEXED_MATCHES),
    ]);

    if (clubsResult.data) {
      clubEntries = clubsResult.data.flatMap((club) =>
        locales.map((locale) => ({
          url: `${SEO_BASE_URL}/${locale}/clubs/${club.id}`,
          lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
    }

    if (rinksResult.data) {
      rinkEntries = rinksResult.data.flatMap((rink) =>
        locales.map((locale) => ({
          url: `${SEO_BASE_URL}/${locale}/rinks/${rink.id}`,
          lastModified: rink.updated_at ? new Date(rink.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
    }

    if (loungeBusinessesResult.data) {
      loungeEntries = loungeBusinessesResult.data.flatMap((business) =>
        locales.map((locale) => ({
          url: `${SEO_BASE_URL}/${locale}/lounge/${business.slug}`,
          lastModified: business.updated_at
            ? new Date(business.updated_at)
            : business.created_at
              ? new Date(business.created_at)
              : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
    }

    if (matchesResult.data) {
      matchEntries = matchesResult.data.flatMap((match) =>
        locales.map((locale) => ({
          url: `${SEO_BASE_URL}/${locale}/match/${match.id}`,
          lastModified: match.updated_at
            ? new Date(match.updated_at)
            : match.start_time
              ? new Date(match.start_time)
              : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.6,
        }))
      );
    }
  } catch (error) {
    console.error("Sitemap: Error fetching dynamic sitemap data", error);
  }

  return [...staticEntries, ...rinkEntries, ...clubEntries, ...loungeEntries, ...matchEntries];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function toSitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : "";
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority =
        typeof entry.priority === "number" ? `<priority>${entry.priority.toFixed(1)}</priority>` : "";

      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    ${lastModified}` : "",
        changeFrequency ? `    ${changeFrequency}` : "",
        priority ? `    ${priority}` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
}
