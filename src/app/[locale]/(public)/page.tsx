import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatches } from "@/app/actions/match";
import { MatchCard } from "@/components/match-card";
import { DateFilter } from "@/components/date-filter";
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

  const t = await getTranslations("home");
  const allMatches = await getMatches();

  // Filter matches by selected date (KST)
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
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </section>

      {/* Date Filter */}
      <Suspense fallback={<div className="h-16" />}>
        <DateFilter />
      </Suspense>

      {/* Matches List */}
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              {t("noMatches")}
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)
        )}
      </section>
    </div>
  );
}
