import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAdminMatches } from "@/app/actions/admin";
import Link from "next/link";
import { AdminMatchCard } from "@/components/admin-match-card";
import { AdminMonthSelector } from "@/components/admin-month-selector";

export default async function AdminMatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const allMatches = await getAdminMatches();

  // 현재 월 결정 (URL 파라미터 또는 현재 날짜)
  const today = new Date();
  const currentMonth = month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = currentMonth.split("-").map(Number);

  // 선택된 월의 경기만 필터링
  const filteredMatches = allMatches.filter((match) => {
    const matchDate = new Date(match.start_time);
    return matchDate.getFullYear() === year && matchDate.getMonth() + 1 === monthNum;
  });

  // 날짜순 정렬 (오름차순)
  const sortedMatches = filteredMatches.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("admin.matches.title")}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <AdminMonthSelector currentMonth={currentMonth} locale={locale} />
          <Link
            href={`/${locale}/admin/matches/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            + {t("admin.matches.create")}
          </Link>
        </div>
      </div>

      {/* 경기 수 표시 */}
      <p className="text-sm text-zinc-400 mb-4">
        {locale === "ko" 
          ? `${sortedMatches.length}개의 경기`
          : `${sortedMatches.length} matches`}
      </p>

      {sortedMatches.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-lg dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            {locale === "ko" 
              ? "이 달에 등록된 경기가 없습니다"
              : "No matches for this month"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedMatches.map((match) => (
            <AdminMatchCard key={match.id} match={match} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
