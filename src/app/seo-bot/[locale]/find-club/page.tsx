import type { Metadata } from "next";
import Link from "next/link";
import { getPublicClubs } from "@/lib/public-clubs";

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
    ? "나에게 맞는 하키클럽 찾기 | 파워플레이"
    : "Find Your Hockey Club | PowerPlay";
  const description = isKo
    ? "3가지 질문으로 나에게 딱 맞는 아이스하키 동호회를 추천받아 보세요. 활동 지역, 실력 수준, 활동 빈도 기준 매칭."
    : "Answer 3 questions and get personalized ice hockey club recommendations based on region, skill, and activity level.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/find-club`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/find-club`,
      languages: {
        ko: `${siteUrl}/ko/find-club`,
        en: `${siteUrl}/en/find-club`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotFindClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const clubs = await getPublicClubs();

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
        name: isKo ? "동호회 찾기" : "Find Club",
        item: `${siteUrl}/${locale}/find-club`,
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
        <span>{isKo ? "동호회 찾기" : "Find Club"}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isKo ? "나에게 맞는 동호회 찾기" : "Find Your Hockey Club"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-6">
          {isKo
            ? "3가지 질문(활동 지역, 실력 수준, 활동 빈도)에 답하면 가장 잘 맞는 아이스하키 동호회를 추천해 드립니다. 게스트로 시작해 정식 가입까지 — 파워플레이가 도와드립니다."
            : "Answer 3 quick questions about region, skill level, and activity frequency, and we'll recommend the best clubs for you. Try as a guest first, then join — PowerPlay makes it easy."}
        </p>
      </header>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-semibold mb-1">{isKo ? "1. 활동 지역" : "1. Region"}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isKo
              ? "서울, 경기, 인천 등 활동 가능한 지역을 선택"
              : "Pick available regions: Seoul, Gyeonggi, Incheon, and more"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-semibold mb-1">{isKo ? "2. 실력 수준" : "2. Skill Level"}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isKo
              ? "초보·중급·고급 — 본인 수준에 맞는 동호회"
              : "Beginner / Intermediate / Advanced — matched to your level"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-semibold mb-1">
            {isKo ? "3. 활동 빈도" : "3. Activity Frequency"}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isKo
              ? "주 1회·월 1~2회 등 본인 페이스에 맞춘 추천"
              : "Weekly, monthly — match your pace"}
          </p>
        </div>
      </section>

      {clubs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            {isKo ? "추천 가능한 동호회 예시" : "Sample Clubs to Discover"}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clubs.slice(0, 12).map((club) => (
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
        </section>
      )}
    </>
  );
}
