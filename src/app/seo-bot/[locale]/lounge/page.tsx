import type { Metadata } from "next";
import Link from "next/link";
import { getPublicLoungeData } from "@/lib/seo/public-lounge";

const siteUrl = "https://powerplay.kr";

export const revalidate = 600;
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
  const title = isKo ? "하키 정보 라운지 | 파워플레이" : "Hockey Lounge | PowerPlay";
  const description = isKo
    ? "유소년 클럽, 레슨, 훈련장, 대회, 브랜드 정보를 파워플레이 라운지에서 한곳에 확인하세요."
    : "Explore youth clubs, lessons, training centers, tournaments, and brand listings in the PowerPlay Lounge.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotLoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const { businesses } = await getPublicLoungeData();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isKo ? "홈" : "Home",
        item: `${siteUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isKo ? "라운지" : "Lounge",
        item: `${siteUrl}/${locale}/lounge`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <Link href={`/${locale}`} className="hover:underline">
          {isKo ? "홈" : "Home"}
        </Link>
        <span className="mx-1">/</span>
        <span>{isKo ? "라운지" : "Lounge"}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isKo ? "하키 정보 라운지" : "Hockey Lounge"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {isKo
            ? "유소년 클럽, 레슨, 훈련장, 대회 등 아이스하키 관련 비즈니스 정보를 한곳에 모았습니다."
            : "A directory of ice hockey-related businesses: youth clubs, lessons, training centers, tournaments, and more."}
        </p>
      </header>

      {businesses.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {isKo
            ? "아직 등록된 라운지 정보가 없습니다."
            : "No lounge listings yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.map((business) => (
            <li
              key={business.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <Link href={`/${locale}/lounge/${business.slug}`} className="block">
                <h2 className="font-semibold mb-1">{business.name}</h2>
                {business.tagline && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    {business.tagline}
                  </p>
                )}
                {business.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 line-clamp-3">
                    {business.description}
                  </p>
                )}
                {business.address && (
                  <p className="text-[11px] text-zinc-500 mt-2">{business.address}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
