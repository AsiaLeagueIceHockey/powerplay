import { setRequestLocale } from "next-intl/server";
import { getRinks } from "@/app/actions/admin";
import Link from "next/link";

export default async function AdminRinksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
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
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg"
            >
              <div>
                <div className="font-medium">{rink.name_ko}</div>
                <div className="text-sm text-zinc-400">{rink.name_en}</div>
              </div>
              <Link
                href={`/${locale}/admin/rinks/${rink.id}/edit`}
                className="text-sm text-blue-400 hover:underline"
              >
                수정
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
