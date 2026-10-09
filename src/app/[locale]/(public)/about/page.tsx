import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutPageContent } from "@/components/about-page-content";
import { HashScrollHandler } from "@/components/hash-scroll-handler";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo ? "회사 소개" : "About PowerPlay";
  const description = isKo
    ? "대한민국 아마추어 아이스하키 커뮤니티를 위한 소프트웨어 스타트업 파워플레이를 소개합니다."
    : "Meet PowerPlay, a South Korean software startup building practical tools for the amateur ice hockey community.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/about`,
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/about`,
      languages: {
        ko: `${siteUrl}/ko/about`,
        en: `${siteUrl}/en/about`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HashScrollHandler />
      <AboutPageContent locale={locale} />
    </>
  );
}
