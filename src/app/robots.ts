import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://powerplay.kr";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/mypage/",
          "/chat/",
          "/onboarding/",
          "/profile/",
          "/admin-apply/",
          "/mypage/points/",
          "/mypage/card/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
