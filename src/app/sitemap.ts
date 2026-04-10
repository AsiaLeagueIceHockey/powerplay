import { MetadataRoute } from "next";
import { buildSitemapEntries, SEO_LOCALES } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries(SEO_LOCALES);
}
