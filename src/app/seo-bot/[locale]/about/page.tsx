import type { Metadata } from "next";
import { AboutPageContent } from "@/components/about-page-content";

const siteUrl = "https://powerplay.kr";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo ? "회사 소개 | 파워플레이" : "About PowerPlay";
  const description = isKo
    ? "2026년 3월 대한민국에서 시작한 아이스하키 소프트웨어 스타트업 파워플레이를 소개합니다."
    : "PowerPlay is a bootstrapped software startup founded in South Korea in March 2026, building tools for the amateur ice hockey community.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/about`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages: { ko: `${siteUrl}/ko/about`, en: `${siteUrl}/en/about` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AboutPageContent locale={locale} />;
}
