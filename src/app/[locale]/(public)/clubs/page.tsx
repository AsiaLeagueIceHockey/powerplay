import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getCachedMatches, getCachedRinks, getRankedClubs } from "@/app/actions/cache";
import { getMyClubVoteSummary } from "@/app/actions/clubs";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { PublicSectionTabs } from "@/components/public-section-tabs";

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

  const [matches, rinks, clubs, clubVoteSummary] = await Promise.all([
    getCachedMatches(),
    getCachedRinks(),
    getRankedClubs(),
    getMyClubVoteSummary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-6 -mt-2">
      <FeedbackBanner locale={locale} />
      <PublicSectionTabs locale={locale} activeTab="club" />

      <section className="sr-only">
        <h1>{locale === "ko" ? "아이스하키 동호회" : "Ice hockey clubs"}</h1>
        <p>
          {locale === "ko"
            ? "지역과 링크장을 기준으로 활동 중인 동호회를 찾고 상세 페이지로 이동할 수 있습니다."
            : "Browse active clubs by region and rink."}
        </p>
      </section>

      <HomeClient
        matches={matches}
        rinks={rinks}
        clubs={clubs}
        clubVoteSummary={clubVoteSummary}
        forcedTab="club"
      />
    </div>
  );
}
