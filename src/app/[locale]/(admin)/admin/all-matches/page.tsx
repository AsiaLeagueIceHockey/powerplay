import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllMatchesForSuperuser } from "@/app/actions/superuser";
import { SuperUserMatchCard } from "@/components/superuser-match-card";
import { AdminMonthSelector } from "@/components/admin-month-selector";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AllMatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
  setRequestLocale(locale);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superuser") {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations();
  const allMatches = await getAllMatchesForSuperuser();

  // 현재 월 결정 (URL 파라미터 또는 현재 날짜)
  const today = new Date();
  const currentMonth = month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = currentMonth.split("-").map(Number);

  // 선택된 월의 경기만 필터링
  const filteredMatches = allMatches.filter((match) => {
    const matchDate = new Date(match.start_time);
    return matchDate.getFullYear() === year && matchDate.getMonth() + 1 === monthNum;
  });

  // 날짜순 정렬 (오름차순 - 미래 경기가 아래로, 과거 경기가 위로? 보통 오름차순이면 과거->미래.
  // AdminMatchesPage uses ascending.
  const sortedMatches = filteredMatches.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
           🌎 {t("admin.menu.allMatches")}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <AdminMonthSelector currentMonth={currentMonth} locale={locale} />
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        {locale === "ko" 
          ? `총 ${allMatches.length}개 중 이번 달 ${sortedMatches.length}개의 경기`
          : `${sortedMatches.length} matches this month (Total ${allMatches.length})`}
      </p>

      {sortedMatches.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg">
          <p className="text-zinc-500">
            {locale === "ko" 
              ? "이 달에 등록된 경기가 없습니다"
              : "No matches for this month"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedMatches.map((match) => (
            <SuperUserMatchCard key={match.id} match={match} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
