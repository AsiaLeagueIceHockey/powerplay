import type { Metadata } from "next";
import Link from "next/link";
import { getPublicRinks } from "@/lib/public-rinks";

const siteUrl = "https://powerplay.kr";

export const revalidate = 1800;
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
  const title = isKo
    ? "전국 링크장 둘러보기 | 파워플레이"
    : "Ice Rink Directory | PowerPlay";
  const description = isKo
    ? "서울, 경기 등 전국 아이스하키 링크장별 예정 경기와 활동 동호회를 한눈에 확인하세요."
    : "Browse ice rinks across Korea and discover upcoming matches and active clubs at each location.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/rinks`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/rinks`,
      languages: { ko: `${siteUrl}/ko/rinks`, en: `${siteUrl}/en/rinks` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotRinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const rinks = await getPublicRinks();

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
        name: isKo ? "링크장" : "Rinks",
        item: `${siteUrl}/${locale}/rinks`,
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
        <span>{isKo ? "링크장" : "Rinks"}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isKo ? "전국 아이스하키 링크장" : "Ice Hockey Rinks in Korea"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {isKo
            ? `서울, 경기, 인천을 비롯한 전국 ${rinks.length}개 아이스하키 링크장 정보입니다. 각 링크장의 상세 페이지에서 활동 동호회와 예정 경기를 확인할 수 있습니다.`
            : `${rinks.length} ice hockey rinks across Korea. Each rink page lists active clubs and upcoming matches.`}
        </p>
      </header>

      {rinks.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {isKo ? "등록된 링크장이 없습니다." : "No rinks listed yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rinks.map((rink) => (
            <li
              key={rink.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <Link href={`/${locale}/rinks/${rink.id}`} className="block">
                <h2 className="font-semibold mb-1">
                  {isKo ? rink.name_ko : rink.name_en || rink.name_ko}
                </h2>
                {rink.address && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    {rink.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500 dark:text-zinc-500 mt-2">
                  {rink.club_count > 0 && (
                    <span>
                      {isKo
                        ? `활동 동호회 ${rink.club_count}개`
                        : `${rink.club_count} active clubs`}
                    </span>
                  )}
                  {rink.upcoming_match_count > 0 && (
                    <span>
                      {isKo
                        ? `예정 경기 ${rink.upcoming_match_count}건`
                        : `${rink.upcoming_match_count} upcoming matches`}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
