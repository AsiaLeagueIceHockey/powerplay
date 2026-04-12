import { setRequestLocale } from "next-intl/server";
import { getCachedMatches, getCachedRinks, getCachedClubs } from "@/app/actions/cache";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { PublicSectionTabs } from "@/components/public-section-tabs";
import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/skeletons";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  return {
    title: isKo ? "파워플레이 - 아이스하키 경기·동호회·게스트 모집" : "PowerPlay - Ice Hockey Games, Clubs & Guest Recruitment",
    description: isKo
      ? "아이스하키 경기 일정 확인, 게스트 참가, 동호회 찾기, 링크장 정보까지. 한국 아이스하키 커뮤니티 플랫폼 파워플레이."
      : "Find ice hockey games, join as a guest player, discover clubs, and explore rinks. The all-in-one platform for Korea's hockey community.",
    openGraph: {
      title: isKo ? "파워플레이 - 아이스하키 경기·동호회·게스트 모집" : "PowerPlay - Ice Hockey Games, Clubs & Guest Recruitment",
      description: isKo
        ? "아이스하키 경기 일정 확인, 게스트 참가, 동호회 찾기, 링크장 정보까지. 한국 아이스하키 커뮤니티 플랫폼 파워플레이."
        : "Find ice hockey games, join as a guest player, discover clubs, and explore rinks. The all-in-one platform for Korea's hockey community.",
      url: `${siteUrl}/${locale}`,
      images: [{ url: `${siteUrl}/og-new.png`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ko: `${siteUrl}/ko`,
        en: `${siteUrl}/en`,
      },
    },
  };
}

// Separate async component for data fetching (enables streaming)
async function HomeContent({ selectedDate }: { selectedDate?: string }) {
  // 병렬 데이터 페칭 (캐싱 적용)
  const [allMatches, rinks, clubs] = await Promise.all([
    getCachedMatches(),  // Cached (15s)
    getCachedRinks(),    // Cached (5min)
    getCachedClubs(),    // Cached (30s)
  ]);

  return (
    <HomeClient
      matches={allMatches} // Pass all matches, filtering will happen on client
      rinks={rinks}
      clubs={clubs}
      initialDate={selectedDate}
      forcedTab="match"
    />
  );
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await params;
  const { date: selectedDate } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-6 -mt-2">
      {/* Feedback Banner - shows immediately */}
      <FeedbackBanner locale={locale} />

      <PublicSectionTabs locale={locale} activeTab="match" />

      {/* Main Content - streamed with Suspense */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent selectedDate={selectedDate} />
      </Suspense>

      <div className="border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        <div className="flex items-center justify-center gap-3">
          <Link href="/rinks" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {locale === "ko" ? "링크장" : "Rinks"}
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/privacy" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {locale === "ko" ? "이용약관" : "Terms of Service"}
          </Link>
        </div>
      </div>
    </div>
  );
}
