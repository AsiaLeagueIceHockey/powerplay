"use client";

import { buttonStyles, iconButtonStyles, linkStyles, surfaceStyles } from "@/components/ui/styles";

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
  // One rank style for every rank (P10); the top three stand out through weight and body color only.
  const isTopRank = Boolean(club.monthly_rank && club.monthly_rank <= 3);
  const rankLabel = locale === "ko"
    ? `응원 ${club.monthly_rank_tied ? "공동 " : ""}${club.monthly_rank}위`
    : `${club.monthly_rank_tied ? "T-" : "#"}${club.monthly_rank}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          router.push(`/${locale}/clubs/${club.id}`);
        }
      }}
      onClick={() => router.push(`/${locale}/clubs/${club.id}`)}
      className={`${surfaceStyles({ interactive: true, density: "default" })} relative flex h-full flex-col justify-between cursor-pointer`}
    >
      <div>
        {/* Logo + Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-pp-control bg-pp-surface-muted flex items-center justify-center overflow-hidden shrink-0">
            {club.logo_url ? (
              <Image
                src={club.logo_url}
                alt={club.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-pp-muted" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-bold leading-snug text-pp-text line-clamp-1">{club.name}</h3>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-pp-muted" aria-hidden="true" />
            </div>
            {/* Key facts as plain text (P9): rank, monthly votes, members. */}
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-pp-muted">
              {showRank ? (
                <>
                  <span className={`inline-flex items-center gap-1 ${isTopRank ? "font-bold text-pp-text" : ""}`}>
                    {isTopRank ? <Medal className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {rankLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span className="font-medium text-pp-text">
                {locale === "ko"
                  ? `이번 달 ${(club.monthly_vote_count ?? 0).toLocaleString()}표`
                  : `${(club.monthly_vote_count ?? 0).toLocaleString()} votes this month`}
              </span>
              {club.member_count !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    {club.member_count}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Description with Expand/Collapse */}
        <div className="mt-3 text-[13px]">
          <p className={`text-sm leading-relaxed text-pp-muted ${isExpanded ? "" : "line-clamp-2"}`}>
            {club.description || (locale === "ko" ? "소개글이 없습니다." : "No description yet.")}
          </p>
          {club.description && club.description.length > 50 && (
            <button type="button" onClick={toggleExpand} className={`${linkStyles()} mt-1`}>
              {isExpanded ? (
                <>
                  {locale === "ko" ? "접기" : "Show Less"} <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  {locale === "ko" ? "더보기" : "Show More"} <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Rinks: one line of text instead of two-line chips. */}
        {club.rinks && club.rinks.length > 0 && (() => {
          const [firstRink, ...otherRinks] = club.rinks;
          const region = extractRegion(firstRink.address);
          return (
            <p className="mt-3 flex min-w-0 items-center gap-1 text-[13px] text-pp-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {locale === "ko" ? firstRink.name_ko : firstRink.name_en}
                {region ? ` · ${region}` : ""}
              </span>
              {otherRinks.length > 0 ? <span className="shrink-0">+{otherRinks.length}</span> : null}
            </p>
          );
        })()}
      </div>

      {/* Secondary actions: one outline vote button and a neutral Kakao icon button, both 44px. */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-pp-border pt-3">
        <button type="button"
          onClick={handleVote}
          disabled={voteDisabled || isVoting}
          className={buttonStyles({ variant: "outline", size: "default" })}
        >
          <Heart className={`h-4 w-4 text-pp-cheer ${voteDisabled ? "" : "fill-current"}`} aria-hidden="true" />
          {isVoting ? "..." : voteLabel}
        </button>

        {/* Kakao Link */}
        {club.kakao_open_chat_url && (
          <a
            href={club.kakao_open_chat_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={iconButtonStyles({ variant: "outline", size: "default" })}
            title="KakaoTalk Open Chat"
            aria-label="KakaoTalk Open Chat"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
          </a>
        )}
      </div>
    </div>
  );
}
