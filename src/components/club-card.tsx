"use client";

import { Club } from "@/app/actions/types";
import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { MessageCircle, Users, Building2, ChevronDown, ChevronUp, MapPin, Heart, Medal, ArrowRight } from "lucide-react";
import { extractRegion } from "@/lib/rink-utils";

interface ClubCardProps {
  club: Club;
  didVoteToday?: boolean;
  onVote?: (clubId: string) => Promise<void> | void;
}

export function ClubCard({
  club,
  didVoteToday = false,
  onVote,
}: ClubCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onVote || isVoting) {
      return;
    }

    setIsVoting(true);
    try {
      await onVote(club.id);
    } finally {
      setIsVoting(false);
    }
  };

  const voteDisabled = didVoteToday;
  const voteLabel = didVoteToday
    ? locale === "ko"
      ? "오늘 투표 완료"
      : "Voted today"
    : locale === "ko"
    ? "응원 투표"
    : "Vote";
  const showRank = Boolean(club.monthly_rank && (club.monthly_vote_count ?? 0) > 0);
  const rankTone =
    club.monthly_rank === 1
      ? "bg-amber-100 text-amber-800 ring-amber-300"
      : club.monthly_rank === 2
      ? "bg-slate-100 text-slate-700 ring-slate-300"
      : club.monthly_rank === 3
      ? "bg-orange-100 text-orange-800 ring-orange-300"
      : "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white";
  const rankLabel = locale === "ko"
    ? `응원 ${club.monthly_rank_tied ? "공동 " : ""}${club.monthly_rank}위`
    : `${club.monthly_rank_tied ? "T-" : "#"}${club.monthly_rank}`;

  return (
    <div
      onClick={() => router.push(`/${locale}/clubs/${club.id}`)}
      className="relative block flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
    >
      {showRank ? (
        <div className={`absolute right-4 -top-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-sm ring-1 ${rankTone}`}>
          {club.monthly_rank && club.monthly_rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : null}
          <span>{rankLabel}</span>
        </div>
      ) : null}

      <div>
        {/* Logo + Header */}
        <div className="mb-3 flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
            {club.logo_url ? (
              <Image 
                src={club.logo_url} 
                alt={club.name} 
                width={48} 
                height={48} 
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">{club.name}</h3>
              <span className="ml-2 inline-flex items-center justify-center text-zinc-400 dark:text-zinc-300">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900">
                <Heart className="h-3 w-3 fill-current" />
                {locale === "ko"
                  ? `이번 달 ${(club.monthly_vote_count ?? 0).toLocaleString()}표`
                  : `${(club.monthly_vote_count ?? 0).toLocaleString()} votes this month`}
              </span>
              {club.member_count !== undefined && (
                <span className="flex items-center text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full shrink-0">
                  <Users className="w-3 h-3 mr-1" />
                  {club.member_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description with Expand/Collapse */}
        <div className="relative mb-4">
             <p className={`text-sm text-zinc-600 dark:text-zinc-400 transition-all ${isExpanded ? "" : "line-clamp-2"}`}>
                {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description yet.")}
             </p>
             
             {/* Simple logic: if description is long enough to potentially clamp (rough heuristic or always show if content exists) */
             /* Since we can't easily detect line overflow in SSR/hydration safe way without complex observation, 
                we'll show the toggle if there is a description. Ideally we'd measure. 
                For now, let's assume if length > 50 chars it might need expanding or just always allow expanding if description exists.
             */}
             {club.description && club.description.length > 50 && (
                <button 
                    onClick={toggleExpand}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mt-1 font-medium bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isExpanded ? (
                        <>
                            {locale === "ko" ? "접기" : "Show Less"} <ChevronUp className="w-3 h-3" />
                        </>
                    ) : (
                        <>
                           {locale === "ko" ? "더보기" : "Show More"} <ChevronDown className="w-3 h-3" />
                        </>
                    )}
                </button>
             )}
        </div>
        
        {/* Rinks */}
        {club.rinks && club.rinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
                {club.rinks.slice(0, 3).map(rink => {
                    const region = extractRegion(rink.address);
                    return (
                        <span key={rink.id} className="flex flex-col gap-0.5 text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <span className="font-medium">{locale === "ko" ? rink.name_ko : rink.name_en}</span>
                            {region && (
                                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    {region}
                                </span>
                            )}
                        </span>
                    );
                })}
                {club.rinks.length > 3 && (
                    <span className="text-xs px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center">
                        +{club.rinks.length - 3}
                    </span>
                )}
            </div>
        )}
      </div>

      <div className="mt-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={handleVote}
          disabled={voteDisabled || isVoting}
          className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-bold transition-all ${
            voteDisabled
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              : "bg-rose-100 text-zinc-900 hover:bg-rose-200"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Heart className={`h-4 w-4 ${voteDisabled ? "" : "fill-rose-500 text-rose-500"}`} />
            {isVoting ? "..." : voteLabel}
          </span>
        </button>

        {/* Kakao Link */}
        {club.kakao_open_chat_url && (
          <a
            href={club.kakao_open_chat_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-10 h-10 bg-[#FAE100] text-[#371D1E] rounded-lg hover:bg-[#FCE620] transition-colors"
            title="KakaoTalk Open Chat"
          >
             <MessageCircle className="w-5 h-5 fill-current" />
          </a>
        )}
      </div>
      </div>
    </div>
  );
}
