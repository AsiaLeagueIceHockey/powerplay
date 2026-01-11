import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatches } from "@/app/actions/match";
import { getRinks } from "@/app/actions/rink";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HomeClient } from "@/components/home-client";
import { Suspense } from "react";

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

  // 병렬 데이터 페칭
  const [t, allMatches, rinks] = await Promise.all([
    getTranslations("home"),
    getMatches(),
    getRinks(),
  ]);

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
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <section className="text-center py-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
      </section>

      {/* Feedback Banner */}
      <FeedbackBanner />

      {/* Main Tabbed Content - Client Component */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-zinc-100 rounded-xl" />}>
        <HomeClient 
            matches={filteredMatches} 
            allMatches={allMatches} 
            rinks={rinks} 
        />
      </Suspense>
    </div>
  );
}
