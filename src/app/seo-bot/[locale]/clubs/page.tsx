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
  const title = isKo ? "동호회 둘러보기 | 파워플레이" : "Club Directory | PowerPlay";
  const description = isKo
    ? "파워플레이에 등록된 아이스하키 동호회 전체 목록과 소개를 확인하세요."
    : "Browse all ice hockey clubs registered on PowerPlay.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/clubs`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/clubs`,
      languages: { ko: `${siteUrl}/ko/clubs`, en: `${siteUrl}/en/clubs` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function SeoBotClubsPage({
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
        name: isKo ? "동호회" : "Clubs",
        item: `${siteUrl}/${locale}/clubs`,
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
        <span>{isKo ? "동호회" : "Clubs"}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isKo ? "동호회 둘러보기" : "Club Directory"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {isKo
            ? `파워플레이에 등록된 ${clubs.length}개 아이스하키 동호회를 확인하세요. 동호회별 상세 페이지에서 참여 방법과 활동 링크장 정보를 볼 수 있습니다.`
            : `Browse ${clubs.length} ice hockey clubs registered on PowerPlay. View each club's profile, home rinks, and how to join.`}
        </p>
      </header>

      {clubs.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {isKo ? "아직 등록된 동호회가 없습니다." : "No clubs registered yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <li
              key={club.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <Link href={`/${locale}/clubs/${club.id}`} className="block">
                <h2 className="font-semibold mb-1">{club.name}</h2>
                {club.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                    {club.description}
                  </p>
                )}
                {club.member_count !== undefined && club.member_count !== null && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-2">
                    {isKo ? `회원 ${club.member_count}명` : `${club.member_count} members`}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
