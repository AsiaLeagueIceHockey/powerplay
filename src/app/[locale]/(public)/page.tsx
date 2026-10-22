import { setRequestLocale } from "next-intl/server";
import { getPublicHomeMatches } from "@/lib/public-matches";
import { FeedbackBanner, HouseLinks } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { PublicSectionTabs } from "@/components/public-section-tabs";
import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/skeletons";
import { Metadata } from "next";
import { FindClubBanner } from "@/components/find-club-banner";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";

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
async function HomeContent() {
  const allMatches = await getPublicHomeMatches();
  const rinks = Array.from(
    new Map(allMatches.flatMap((match) => match.rink ? [[match.rink.id, match.rink] as const] : [])).values()
  );

  return (
    <HomeClient
      matches={allMatches} // Pass all matches, filtering will happen on client
      rinks={rinks}
      clubs={[]}
      forcedTab="match"
    />
  );
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; date?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab, date } = await searchParams;

  if (tab === "rink") {
    redirect(`/${locale}/rinks`);
  }
  // Keep shared match/date links working while normal home visits open Clubs.
  if (tab !== "match" && !date) {
    redirect(`/${locale}/clubs`);
  }

  return (
    <div className="flex flex-col gap-6 -mt-2">
      {/* Feedback Banner - shows immediately */}
      <FeedbackBanner locale={locale} />

      <PublicSectionTabs locale={locale} activeTab="match" />

      {/* Find Club CTA */}
      <FindClubBanner />

      {/* Main Content - streamed with Suspense */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent />
      </Suspense>

      <HouseLinks />

      <div className="border-t border-pp-border pt-3 text-center text-[11px] text-pp-muted ">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <Link href="/about" className="transition-colors hover:text-pp-muted ">
            {locale === "ko" ? "회사 소개" : "About"}
          </Link>
          <span aria-hidden="true">|</span>
          <a
            href={`/${locale}/about#contact`}
            className="transition-colors hover:text-pp-muted "
          >
            {locale === "ko" ? "문의" : "Contact"}
          </a>
          <span aria-hidden="true">|</span>
          <Link href="/privacy" className="transition-colors hover:text-pp-muted ">
            {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms" className="transition-colors hover:text-pp-muted ">
            {locale === "ko" ? "이용약관" : "Terms of Service"}
          </Link>
        </div>
      </div>
    </div>
  );
}
