import { MetadataRoute } from "next";
import { SEO_BASE_URL } from "@/lib/seo/sitemap";

export default function robots(): MetadataRoute.Robots {
  const locales = ["ko", "en"];
  const privatePaths = [
    "/admin/",
    "/api/",
    "/mypage/",
    "/chat/",
    "/onboarding/",
    "/profile/",
    "/admin-apply/",
    "/mypage/points/",
    "/mypage/card/",
    "/seo-bot/",
  ];
  const localePrivatePaths = locales.flatMap((locale) =>
    privatePaths.map((path) => `/${locale}${path}`)
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privatePaths, ...localePrivatePaths],
    },
    host: SEO_BASE_URL,
    sitemap: [`${SEO_BASE_URL}/sitemap.xml`, `${SEO_BASE_URL}/naver-sitemap.xml`],
  };
}
