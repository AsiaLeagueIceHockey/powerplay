import { buildSitemapEntries, NAVER_SITEMAP_LOCALES, toSitemapXml } from "@/lib/seo/sitemap";

export const revalidate = 3600;

export async function GET() {
  const entries = await buildSitemapEntries(NAVER_SITEMAP_LOCALES);
  const xml = toSitemapXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
