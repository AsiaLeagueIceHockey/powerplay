import Link from "next/link";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getPublicClubs } from "@/lib/public-clubs";
import { extractRegion } from "@/lib/rink-utils";

const siteUrl = "https://powerplay.kr";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  return {
    title: isKo ? "동호회 둘러보기" : "Club Directory",
    description: isKo
      ? "파워플레이에 등록된 아이스하키 동호회를 한곳에서 확인해보세요."
      : "Browse ice hockey clubs registered on PowerPlay.",
    openGraph: {
      title: isKo ? "동호회 둘러보기" : "Club Directory",
      description: isKo
        ? "파워플레이에 등록된 아이스하키 동호회 목록"
        : "Ice hockey club directory on PowerPlay.",
      url: `${siteUrl}/${locale}/clubs`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/clubs`,
      languages: {
        ko: `${siteUrl}/ko/clubs`,
        en: `${siteUrl}/en/clubs`,
      },
    },
  };
}

export default async function ClubsDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const clubs = await getPublicClubs();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "동호회 둘러보기" : "Club Directory"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "ko"
            ? "파워플레이에서 활동 중인 동호회를 찾아보고 각 동호회 소개와 공지사항을 확인해보세요."
            : "Explore clubs on PowerPlay and open each club page for introductions and notices."}
        </p>
      </div>

      {clubs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {locale === "ko" ? "등록된 동호회가 없습니다." : "No clubs available yet."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const region = club.rinks?.[0]?.address ? extractRegion(club.rinks[0].address) : null;
            return (
              <Link
                key={club.id}
                href={`/${locale}/clubs/${club.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{club.name}</div>
                {club.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{club.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{region || (locale === "ko" ? "동호회 상세 보기" : "View club details")}</span>
                  <span>
                    {locale === "ko"
                      ? `멤버 ${club.member_count || 0}명`
                      : `${club.member_count || 0} members`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
