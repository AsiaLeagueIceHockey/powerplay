import { setRequestLocale } from "next-intl/server";
import { getMyClubs } from "@/app/actions/clubs";
import { getCachedMatches, getCachedRinks, getCachedClubs } from "@/app/actions/cache";
import { getProfile } from "@/app/actions/auth";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/skeletons";
import { Metadata } from "next";
import Link from "next/link";

const siteUrl = "https://powerplay.kr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  return {
    title: isKo ? "파워플레이 - 아이스하키 경기 매칭" : "PowerPlay - Ice Hockey Match Management",
    description: isKo
      ? "아이스하키 동호회 경기 일정 확인, 게스트 참가 신청, 팀 매칭까지. 파워플레이에서 경기를 찾아보세요."
      : "Find ice hockey matches, register as a guest player, and manage team matchups. Discover games on PowerPlay.",
    openGraph: {
      title: isKo ? "파워플레이 - 아이스하키 경기 매칭" : "PowerPlay - Ice Hockey Match Management",
      description: isKo
        ? "아이스하키 동호회 경기 운영 및 게스트 매칭 관리 플랫폼"
        : "Ice hockey club match management and player matching platform",
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
  const [allMatches, rinks, clubs, myClubs, profile] = await Promise.all([
    getCachedMatches(),  // Cached (15s)
    getCachedRinks(),    // Cached (5min)
    getCachedClubs(),    // Cached (30s)
    getMyClubs(),        // User-specific, no cache
    getProfile(),        // User profile for role check
  ]);

  const myClubIds = new Set(myClubs.map(c => c.club_id));

  return (
    <HomeClient
      matches={allMatches} // Pass all matches, filtering will happen on client
      rinks={rinks}
      clubs={clubs}
      myClubIds={Array.from(myClubIds)}
      initialDate={selectedDate}
      userRole={profile?.role}
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
  const isKo = locale === "ko";

  return (
    <div className="flex flex-col gap-6 -mt-2">
      {/* Feedback Banner - shows immediately */}
      <FeedbackBanner />

      {/* Main Content - streamed with Suspense */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent selectedDate={selectedDate} />
      </Suspense>

      <div className="border-t border-zinc-200 pt-3 text-center text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        <div className="flex items-center justify-center gap-3">
          <Link href={`/${locale}/privacy`} className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {isKo ? "개인정보처리방침" : "Privacy Policy"}
          </Link>
          <span aria-hidden="true">|</span>
          <Link href={`/${locale}/terms`} className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {isKo ? "이용약관" : "Terms of Service"}
          </Link>
        </div>
      </div>
    </div>
  );
}
