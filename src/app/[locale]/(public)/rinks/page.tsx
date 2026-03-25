import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getCachedClubs, getCachedMatches } from "@/app/actions/cache";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PublicSectionTabs } from "@/components/public-section-tabs";
import { RinkExplorer } from "@/components/rink-explorer";
import { getPublicRinks } from "@/lib/public-rinks";

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
    title: isKo ? "전국 링크장 둘러보기" : "Ice Rink Directory",
    description: isKo
      ? "서울, 경기 등 전국 아이스하키 링크장별 예정 경기와 활동 동호회를 한눈에 확인해보세요."
      : "Browse ice rinks across Korea and discover upcoming matches and active clubs.",
    openGraph: {
      title: isKo ? "전국 링크장 둘러보기" : "Ice Rink Directory",
      description: isKo
        ? "링크장별 경기 일정과 동호회를 확인할 수 있는 파워플레이 링크장 디렉토리"
        : "PowerPlay's rink directory for schedules and clubs by location.",
      url: `${siteUrl}/${locale}/rinks`,
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "website",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/rinks`,
      languages: {
        ko: `${siteUrl}/ko/rinks`,
        en: `${siteUrl}/en/rinks`,
      },
    },
  };
}

export default async function RinksDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [rinks, matches, clubs] = await Promise.all([
    getPublicRinks(),
    getCachedMatches(),
    getCachedClubs(),
  ]);
  const isKo = locale === "ko";

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-6 -mt-2">
      <FeedbackBanner />
      <PublicSectionTabs locale={locale} activeTab="rink" />

      <section className="sr-only">
        <h1>{isKo ? "전국 아이스하키 링크장" : "Ice hockey rinks across Korea"}</h1>
        <p>
          {isKo
            ? "지도와 목록으로 링크장을 찾고, 각 링크장 상세 페이지에서 예정 경기와 활동 중인 동호회를 확인할 수 있습니다."
            : "Browse rinks by map or list and open each rink page for match and club details."}
        </p>
        <p>{`Rinks: ${rinks.length}`}</p>
      </section>

      <section>
        <RinkExplorer rinks={rinks} matches={matches} clubs={clubs} />
      </section>
    </div>
  );
}
