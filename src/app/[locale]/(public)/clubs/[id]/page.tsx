import { getPublicClubById, getPublicClubIds, getPublicClubNotices } from "@/lib/public-clubs";
import { getMyClubVoteSummary, isClubMember } from "@/app/actions/clubs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MessageCircle, Users, Calendar, Building2, MapPin, CreditCard, Heart, Medal } from "lucide-react";
import { ClubVoteButton } from "@/components/club-vote-button";
import { ClubSubscribeButton } from "@/components/club-subscribe-button";
import { ClubShareButton } from "@/components/club-share-button";
import {
  clubDetailActionButtonClass,
  clubDetailActionIconClass,
  clubDetailActionLabelClass,
} from "@/components/club-detail-action-styles";
import { SportsTeamJsonLd } from "@/components/json-ld";
import Link from "next/link";
import Image from "next/image";
import { extractRegion } from "@/lib/rink-utils";
import { Metadata } from "next";

const siteUrl = "https://powerplay.kr";
export const revalidate = 900;
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await getPublicClubIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const club = await getPublicClubById(id);
  if (!club) return {};

  const isKo = locale === "ko";
  const title = club.name;
  const description = club.description
    ? club.description.substring(0, 160)
    : isKo
    ? `${club.name} - 아이스하키 동호회 | 파워플레이`
    : `${club.name} - Ice Hockey Club | PowerPlay`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}/clubs/${id}`,
      ...(club.logo_url && {
        images: [{ url: club.logo_url, width: 256, height: 256, alt: club.name }],
      }),
      siteName: "PowerPlay",
      locale: isKo ? "ko_KR" : "en_US",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/clubs/${id}`,
      languages: {
        ko: `${siteUrl}/ko/clubs/${id}`,
        en: `${siteUrl}/en/clubs/${id}`,
      },
    },
  };
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("club");

  const [club, notices, clubVoteSummary, isSubscribed] = await Promise.all([
    getPublicClubById(id),
    getPublicClubNotices(id),
    getMyClubVoteSummary(),
    isClubMember(id),
  ]);

  if (!club) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SportsTeamJsonLd club={club} locale={locale} />
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {/* Club Logo */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {club.logo_url ? (
              <Image 
                src={club.logo_url} 
                alt={club.name} 
                width={64} 
                height={64} 
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-zinc-400" />
            )}
          </div>
          
          {/* Club Name & Member Count */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight break-keep">
              {club.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {club.member_count !== undefined && (
                <span className="inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full w-fit">
                <Users className="w-3.5 h-3.5 mr-1" />
                {club.member_count} {locale === "ko" ? "명" : "Members"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {club.monthly_rank && (club.monthly_vote_count ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
                  <Medal className="h-3.5 w-3.5" />
                  {locale === "ko"
                    ? `${club.monthly_rank_tied ? "공동 " : ""}${club.monthly_rank}위`
                    : `${club.monthly_rank_tied ? "T-" : "#"}${club.monthly_rank}`}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900">
                <Heart className="h-3.5 w-3.5 fill-current" />
                {locale === "ko"
                  ? `이번 달 응원 ${(club.monthly_vote_count ?? 0).toLocaleString()}표`
                  : `${(club.monthly_vote_count ?? 0).toLocaleString()} votes this month`}
              </span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <ClubShareButton club={club} />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col gap-6">

          {/* Middle Row: Description */}
          <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
            {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description.")}
          </p>

          {/* Main Rinks */}
          {club.rinks && club.rinks.length > 0 && (
             <div className="flex flex-col gap-2 mt-2">
                 <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {locale === "ko" ? "주 이용 링크장" : "Main Rinks"}
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {club.rinks.map(rink => {
                        const region = extractRegion(rink.address);
                        const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(rink.name_ko)}`;
                        return (
                            <a
                                key={rink.id}
                                href={naverMapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col gap-1 text-sm px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                            >
                                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{locale === "ko" ? rink.name_ko : rink.name_en}</span>
                                {region && (
                                    <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        {region}
                                    </span>
                                )}
                            </a>
                        );
                    })}
                 </div>
             </div>
          )}

          {/* Bottom Row: Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
             <ClubVoteButton
               clubId={club.id}
               isLoggedIn={clubVoteSummary.isLoggedIn}
               didVoteToday={clubVoteSummary.votedClubIdsToday.includes(club.id)}
             />

             <Link
               href={`/${locale}/clubs/${club.id}/card`}
               className={`${clubDetailActionButtonClass} border border-zinc-200 bg-zinc-900 text-white transition-colors hover:bg-zinc-800 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`}
             >
               <CreditCard className={clubDetailActionIconClass} />
               <span className={clubDetailActionLabelClass}>{t("card.view", { fallback: "동호회 카드 보기" })}</span>
             </Link>

             <ClubSubscribeButton
               clubId={club.id}
               isLoggedIn={clubVoteSummary.isLoggedIn}
               isSubscribed={isSubscribed}
               className={club.kakao_open_chat_url ? "" : "col-span-2"}
             />

             {club.kakao_open_chat_url && (
               <a
                 href={club.kakao_open_chat_url}
                 target="_blank"
                 rel="noreferrer"
                 className={`${clubDetailActionButtonClass} bg-[#FAE100] text-[#371D1E] transition-colors hover:bg-[#FCE620]`}
               >
                 <MessageCircle className={`${clubDetailActionIconClass} fill-current`} />
                 <span className={clubDetailActionLabelClass}>
                   {locale === "ko" ? "오픈채팅 참여" : "KakaoTalk Open Chat"}
                 </span>
               </a>
             )}
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
