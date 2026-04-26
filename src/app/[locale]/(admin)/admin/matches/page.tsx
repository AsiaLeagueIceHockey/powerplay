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
      <div className="mb-6 space-y-3">
        {/* Row 1: Title + Month Selector */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold shrink-0">{t("admin.matches.title")}</h1>
          <AdminMonthSelector currentMonth={currentMonth} locale={locale} />
        </div>
        {/* Row 2: Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/matches/new`}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            + {t("admin.matches.create")}
          </Link>
          <Link
            href={`/${locale}/admin/matches/bulk?month=${currentMonth}`}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            📅 {t("admin.matches.bulkCreate")}
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-50">
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 whitespace-nowrap text-[clamp(8px,2.55vw,14px)] leading-none tracking-tight">
            <span className="text-amber-300">•</span>
            <span>{t("admin.matches.noticeLine1")}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap text-[clamp(8px,2.55vw,14px)] leading-none tracking-tight">
            <span className="text-amber-300">•</span>
            <span>{t("admin.matches.noticeLine2")}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap text-[clamp(8px,2.55vw,14px)] leading-none tracking-tight">
            <span className="text-amber-300">•</span>
            <span>{t("admin.matches.noticeLine3")}</span>
          </li>
        </ul>
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
