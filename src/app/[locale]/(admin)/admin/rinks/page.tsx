import { setRequestLocale } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminRinkCard } from "@/components/admin-rink-card";

export default async function AdminRinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isSuperUser = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isSuperUser = profile?.role === "superuser";
  }

  const rinks = await getRinks();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">링크장 관리</h1>
        <Link
          href={`/${locale}/admin/rinks/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + 새 링크 추가
        </Link>
      </div>

      {rinks.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg">
          <p className="text-zinc-400">등록된 링크가 없습니다</p>
          <Link
            href={`/${locale}/admin/rinks/new`}
            className="mt-4 inline-block text-blue-400 hover:underline"
          >
            첫 번째 링크 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rinks.map((rink) => (
            <AdminRinkCard
              key={rink.id}
              locale={locale}
              isSuperUser={isSuperUser}
              rink={rink}
            />
          ))}
        </div>
      )}
    </div>
  );
}
