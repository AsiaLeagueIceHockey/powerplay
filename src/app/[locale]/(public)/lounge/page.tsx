import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getPublicLoungeData } from "@/app/actions/lounge";
import { LoungePageClient } from "@/components/lounge-page-client";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  return {
    title: isKo ? "하키 정보 라운지" : "Hockey Lounge",
    description: isKo
      ? "유소년 클럽, 레슨, 훈련장, 대회, 브랜드 정보를 파워플레이 라운지에서 확인해보세요."
      : "Explore youth clubs, lessons, training centers, tournaments, and brand listings in the PowerPlay Lounge.",
    openGraph: {
      title: isKo ? "하키 정보 라운지" : "Hockey Lounge",
      description: isKo
        ? "아이스하키 유소년 클럽, 레슨, 훈련장, 대회 정보를 모아보는 파워플레이 라운지"
        : "PowerPlay Lounge for youth clubs, lessons, training centers, and tournament info.",
      url: `${siteUrl}/${locale}/lounge`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/lounge`,
      languages: {
        ko: `${siteUrl}/ko/lounge`,
        en: `${siteUrl}/en/lounge`,
      },
    },
  };
}

export default async function LoungePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { locale } = await params;
  const { source } = await searchParams;
  setRequestLocale(locale);

  const data = await getPublicLoungeData();

  return (
    <div className="flex flex-col gap-6 -mt-2">
      <LoungePageClient businesses={data.businesses} events={data.events} locale={locale} source={source} />
    </div>
  );
}
