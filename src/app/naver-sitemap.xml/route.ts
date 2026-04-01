import { createServerClient } from "@supabase/ssr";

const baseUrl = "https://powerplay.kr";

function createPublicSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrlEntry(url: string, lastModified?: string | null) {
  return [
    "<url>",
    `<loc>${escapeXml(url)}</loc>`,
    lastModified ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>` : null,
    "</url>",
  ]
    .filter(Boolean)
    .join("");
}

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const [clubsResult, rinksResult, loungeResult] = await Promise.all([
    supabase.from("clubs").select("id, updated_at"),
    supabase
      .from("rinks")
      .select("id, updated_at")
      .eq("is_approved", true),
    supabase
      .from("lounge_businesses")
      .select("slug, updated_at, created_at")
      .eq("is_published", true),
  ]);

  const urls = [
    buildUrlEntry(`${baseUrl}/ko`),
    buildUrlEntry(`${baseUrl}/ko/rinks`),
    buildUrlEntry(`${baseUrl}/ko/clubs`),
    buildUrlEntry(`${baseUrl}/ko/lounge`),
    ...(rinksResult.data ?? []).map((rink) =>
      buildUrlEntry(`${baseUrl}/ko/rinks/${rink.id}`, rink.updated_at)
    ),
    ...(clubsResult.data ?? []).map((club) =>
      buildUrlEntry(`${baseUrl}/ko/clubs/${club.id}`, club.updated_at)
    ),
    ...(loungeResult.data ?? []).map((business) =>
      buildUrlEntry(
        `${baseUrl}/ko/lounge/${business.slug}`,
        business.updated_at ?? business.created_at
      )
    ),
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
