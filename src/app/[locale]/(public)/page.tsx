import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMyClubs } from "@/app/actions/clubs";
import { getCachedMatches, getCachedRinks, getCachedClubs } from "@/app/actions/cache";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { Suspense } from "react";
import { HomePageSkeleton } from "@/components/skeletons";

// Separate async component for data fetching (enables streaming)
async function HomeContent({ locale, selectedDate }: { locale: string; selectedDate?: string }) {
  // 병렬 데이터 페칭 (캐싱 적용)
  const [allMatches, rinks, clubs, myClubs] = await Promise.all([
    getCachedMatches(),  // Cached (15s)
    getCachedRinks(),    // Cached (5min)
    getCachedClubs(),    // Cached (30s)
    getMyClubs(),        // User-specific, no cache
  ]);

  const myClubIds = new Set(myClubs.map(c => c.club_id));

  // Filter matches by selected date (KST) for the Match List View
  const filteredMatches = selectedDate
    ? allMatches.filter((match) => {
        const matchDate = new Date(match.start_time);
        const year = matchDate.getFullYear();
        const month = String(matchDate.getMonth() + 1).padStart(2, "0");
        const day = String(matchDate.getDate()).padStart(2, "0");
        const matchDateString = `${year}-${month}-${day}`;
        return matchDateString === selectedDate;
      })
    : allMatches;

  return (
    <HomeClient 
      matches={filteredMatches} 
      allMatches={allMatches} 
      rinks={rinks} 
      clubs={clubs}
      myClubIds={Array.from(myClubIds)}
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
    <div className="flex flex-col gap-6">
      {/* Feedback Banner - shows immediately */}
      <FeedbackBanner />

      {/* Main Content - streamed with Suspense */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent locale={locale} selectedDate={selectedDate} />
      </Suspense>
    </div>
  );
}
