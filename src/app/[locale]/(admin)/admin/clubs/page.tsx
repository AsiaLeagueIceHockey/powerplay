import { setRequestLocale } from "next-intl/server";
import { getClubs } from "@/app/actions/clubs";
import Link from "next/link";
import { Users, MessageCircle } from "lucide-react";

export default async function AdminClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const clubs = await getClubs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏒 동호회 관리</h1>
        <Link
          href={`/${locale}/admin/clubs/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          + 새 동호회 등록
        </Link>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg">
          <p className="text-zinc-400">등록된 동호회가 없습니다</p>
          <Link
            href={`/${locale}/admin/clubs/new`}
            className="mt-4 inline-block text-blue-400 hover:underline"
          >
            첫 번째 동호회 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-lg">{club.name}</div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    멤버 {club.member_count || 0}명
                  </span>
                  {club.kakao_open_chat_url && (
                    <a
                      href={club.kakao_open_chat_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-yellow-400 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      오픈채팅
                    </a>
                  )}
                </div>
              </div>
              <Link
                href={`/${locale}/admin/clubs/${club.id}/edit`}
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
