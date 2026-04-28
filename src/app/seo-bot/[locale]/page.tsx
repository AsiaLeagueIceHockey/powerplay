import type { Metadata } from "next";
import Link from "next/link";
import { getPublicClubs } from "@/lib/public-clubs";
import { getPublicRinks } from "@/lib/public-rinks";

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

  const title = isKo
    ? "파워플레이 - 아이스하키 경기·동호회·게스트 모집"
    : "PowerPlay - Ice Hockey Games, Clubs & Guest Recruitment";
  const description = isKo
    ? "아이스하키 경기 일정 확인, 게스트 참가, 동호회 찾기, 링크장 정보까지. 한국 아이스하키 커뮤니티 플랫폼 파워플레이."
    : "Find ice hockey games, join as a guest player, discover clubs, and explore rinks. The all-in-one platform for Korea's hockey community.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: { ko: `${siteUrl}/ko`, en: `${siteUrl}/en` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";

  const [clubs, rinks] = await Promise.all([getPublicClubs(), getPublicRinks()]);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PowerPlay",
    alternateName: isKo ? "파워플레이" : "PowerPlay",
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/long-logo.jpg`,
    sameAs: ["https://www.instagram.com/powerplay.kr"],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PowerPlay",
    url: `${siteUrl}/${locale}`,
    inLanguage: isKo ? "ko-KR" : "en-US",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {isKo
            ? "파워플레이 — 아이스하키 경기·동호회·게스트 모집"
            : "PowerPlay — Ice Hockey Games, Clubs & Guest Recruitment"}
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-7">
          {isKo
            ? "전국 아이스하키 동호회와 경기 일정을 한 곳에서 확인하세요. 게스트 참가 신청, 나에게 맞는 동호회 찾기, 전국 링크장 정보까지 — 파워플레이는 한국 아이스하키 커뮤니티의 만남을 돕는 플랫폼입니다."
            : "Find ice hockey games and clubs across Korea, all in one place. Guest matchmaking, personalized club recommendations, and rink information — PowerPlay connects Korea's ice hockey community."}
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Link
          href={`/${locale}/find-club`}
          className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-1">
            {isKo ? "나에게 맞는 동호회 찾기" : "Find Your Club"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isKo ? "3가지 질문으로 맞춤 동호회 추천" : "Get matched in 3 questions"}
          </p>
        </Link>
        <Link
          href={`/${locale}/clubs`}
          className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-1">
            {isKo ? "동호회 둘러보기" : "Browse Clubs"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isKo ? "전국 등록 동호회 목록" : "All registered clubs"}
          </p>
        </Link>
        <Link
          href={`/${locale}/rinks`}
          className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-1">
            {isKo ? "전국 링크장" : "Ice Rinks"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isKo ? "지역별 링크장과 예정 경기" : "Rinks by region with upcoming games"}
          </p>
        </Link>
        <Link
          href={`/${locale}/lounge`}
          className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 transition-colors"
        >
          <h2 className="text-lg font-semibold mb-1">
            {isKo ? "하키 정보 라운지" : "Hockey Lounge"}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isKo
              ? "유소년 클럽, 레슨, 훈련장, 대회 정보"
              : "Youth clubs, lessons, training centers, tournaments"}
          </p>
        </Link>
      </section>

      {clubs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            {isKo ? "등록 동호회" : "Registered Clubs"}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clubs.slice(0, 24).map((club) => (
              <li
                key={club.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <Link href={`/${locale}/clubs/${club.id}`} className="block">
                  <h3 className="font-medium mb-1">{club.name}</h3>
                  {club.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {club.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {clubs.length > 24 && (
            <Link
              href={`/${locale}/clubs`}
              className="inline-block mt-4 text-sm text-blue-600 hover:underline"
            >
              {isKo
                ? `전체 ${clubs.length}개 동호회 보기 →`
                : `View all ${clubs.length} clubs →`}
            </Link>
          )}
        </section>
      )}

      {rinks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            {isKo ? "전국 아이스하키 링크장" : "Ice Hockey Rinks"}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rinks.slice(0, 20).map((rink) => (
              <li
                key={rink.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <Link href={`/${locale}/rinks/${rink.id}`} className="block">
                  <h3 className="font-medium mb-1">
                    {isKo ? rink.name_ko : rink.name_en || rink.name_ko}
                  </h3>
                  {rink.address && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {rink.address}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
