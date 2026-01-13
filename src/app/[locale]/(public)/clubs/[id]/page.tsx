import { getClub, getClubNotices, isClubMember, joinClub } from "@/app/actions/clubs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MessageCircle, Users, Calendar } from "lucide-react";
import { JoinClubButton } from "@/components/join-club-button"; // Separate client component for interactivity

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("club");

  const [club, notices, isMember] = await Promise.all([
    getClub(id),
    getClubNotices(id),
    isClubMember(id),
  ]);

  if (!club) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Club Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white flex items-center gap-3">
              {club.name}
              {club.member_count !== undefined && (
                <span className="flex items-center text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                  <Users className="w-4 h-4 mr-1" />
                  {club.member_count}
                </span>
              )}
            </h1>
            
            <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed mb-6">
              {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description.")}
            </p>

            <div className="flex flex-wrap gap-3">
               <JoinClubButton club={club} initialIsMember={isMember} />
               
               {club.kakao_open_chat_url && (
                 <a
                   href={club.kakao_open_chat_url}
                   target="_blank"
                   rel="noreferrer"
                   className="flex items-center gap-2 px-4 py-2 bg-[#FAE100] text-[#371D1E] rounded-lg font-medium hover:bg-[#FCE620] transition-colors"
                 >
                   <MessageCircle className="w-5 h-5" />
                   {locale === "ko" ? "오픈채팅 참여" : "KakaoTalk"}
                 </a>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Notices Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {locale === "ko" ? "공지사항" : "Notices"}
          <span className="text-sm font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {notices.length}
          </span>
        </h2>

        {notices.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-zinc-500">{locale === "ko" ? "등록된 공지사항이 없습니다." : "No notices yet."}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {notice.title}
                  </h3>
                  <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.created_at).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
                       year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed">
                  {notice.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
