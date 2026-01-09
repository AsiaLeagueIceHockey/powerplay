import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatches } from "@/app/actions/match";
import { MatchCard } from "@/components/match-card";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const matches = await getMatches();

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </section>

      {/* Matches List */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.length === 0 ? (
          <div className="col-span-full rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              {t("noMatches")}
            </p>
          </div>
        ) : (
          matches.map((match) => <MatchCard key={match.id} match={match} />)
        )}
      </section>
    </div>
  );
}
