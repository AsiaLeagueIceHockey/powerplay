import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllMatchesForSuperuser } from "@/app/actions/superuser";
import { AdminMonthSelector } from "@/components/admin-month-selector";
import { SuperuserMatchBrowser } from "@/components/superuser-match-browser";
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

  // 현재 월 결정 (URL 파라미터 또는 현재 날짜)
  const today = new Date();
  const currentMonth = month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const matches = await getAllMatchesForSuperuser(currentMonth);

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

      <SuperuserMatchBrowser matches={matches} locale={locale} currentMonth={currentMonth} />
    </div>
  );
}
