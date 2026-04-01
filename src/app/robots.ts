import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://powerplay.kr";
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
  ];
  const localePrivatePaths = locales.flatMap((locale) =>
    privatePaths.map((path) => `/${locale}${path}`)
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privatePaths, ...localePrivatePaths],
      },
      {
        userAgent: "Yeti",
        allow: [
          "/",
          "/ko/",
          "/ko/rinks",
          "/ko/rinks/",
          "/ko/clubs",
          "/ko/clubs/",
          "/ko/lounge",
          "/ko/lounge/",
          "/ko/match/",
        ],
        disallow: [...privatePaths, ...localePrivatePaths],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/naver-sitemap.xml`],
  };
}
