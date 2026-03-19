import { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

const baseUrl = "https://powerplay.kr";
const locales = ["ko", "en"];

/**
 * Dynamic sitemap generation
 * Fetches all public clubs and matches from Supabase
 * to ensure every user-accessible page is discoverable by search engines.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Create a lightweight Supabase client without cookies (sitemap is not user-specific)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // --- Static Pages ---
  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/clubs", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/signup", changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );

  // --- Dynamic: Clubs ---
  let clubEntries: MetadataRoute.Sitemap = [];
  try {
    const { data: clubs } = await supabase
      .from("clubs")
      .select("id, updated_at");

    if (clubs) {
      clubEntries = clubs.flatMap((club) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/clubs/${club.id}`,
          lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      );
    }
  } catch (e) {
    console.error("Sitemap: Error fetching clubs", e);
  }

  // --- Dynamic: Matches ---
  let matchEntries: MetadataRoute.Sitemap = [];
  try {
    const nowIso = new Date().toISOString();
    const { data: matches } = await supabase
      .from("matches")
      .select("id, start_time, status, updated_at")
      .eq("status", "open")
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true });

    if (matches) {
      matchEntries = matches.flatMap((match) =>
        locales.map((locale) => ({
          url: `${baseUrl}/${locale}/match/${match.id}`,
          lastModified: match.updated_at
            ? new Date(match.updated_at)
            : match.start_time
            ? new Date(match.start_time)
            : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }))
      );
    }
  } catch (e) {
    console.error("Sitemap: Error fetching matches", e);
  }

  return [...staticEntries, ...clubEntries, ...matchEntries];
}
