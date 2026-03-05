import { setRequestLocale } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApproveRinkButton } from "@/components/approve-rink-button";
import { MapPin } from "lucide-react";

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
        <h1 className="text-2xl font-bold">🏟️ 링크 관리</h1>
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
            <div
              key={rink.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg relative"
            >
              <div className="pr-8 sm:pr-0 w-full sm:w-auto flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-medium">{rink.name_ko}</span>
                  {rink.map_url && (
                    <a
                      href={rink.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-700/50 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                      title="지도 보기"
                    >
                      <MapPin className="w-3 h-3" />
                      지도에서 보기
                    </a>
                  )}
                  {!rink.is_approved && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      승인 대기 중
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">{rink.name_en}</div>
              </div>
              
              <div className="flex items-center gap-3">
                {!rink.is_approved && isSuperUser && (
                  <ApproveRinkButton rinkId={rink.id} />
                )}
                {isSuperUser && (
                  <Link
                    href={`/${locale}/admin/rinks/${rink.id}/edit`}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    수정
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
