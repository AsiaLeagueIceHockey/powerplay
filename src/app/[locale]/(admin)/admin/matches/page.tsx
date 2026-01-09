import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAdminMatches } from "@/app/actions/admin";
import Link from "next/link";
import { AdminMatchCard } from "@/components/admin-match-card";

export default async function AdminMatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const matches = await getAdminMatches();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">경기 관리</h1>
        <Link
          href={`/${locale}/admin/matches/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + {t("admin.matches.create")}
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            {t("admin.matches.noMatches")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <AdminMatchCard key={match.id} match={match} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

