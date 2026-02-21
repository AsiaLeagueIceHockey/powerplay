"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminParticipantList } from "./admin-participant-list";
import { AdminNewBadge, markMatchAsSeen } from "./admin-new-badge";

interface Match {
  id: string;
  start_time: string;
  status: "open" | "closed" | "canceled";
  rink: {
    name_ko: string;
    name_en: string;
  } | null;
  participants: any[];
  participants_count: {
    fw: number;
    df: number;
    g: number;
  };
  entry_points: number;
  max_skaters: number;
  max_goalies: number;
  match_type?: string;
  fee: number;
  creator?: {
    full_name: string | null;
    email: string;
  };
}

export function SuperUserMatchCard({
  match,
  locale,
}: {
  match: Match;
  locale: string;
}) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const t = useTranslations("admin");
  const tMatch = useTranslations("match");

  const totalParticipants = match.participants?.length || 0;

  const handleToggleParticipants = () => {
    if (!showParticipants) {
      markMatchAsSeen(match.id, totalParticipants);
      setBadgeKey(prev => prev + 1);
    }
    setShowParticipants(!showParticipants);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: locale === "ko" ? "long" : "short",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    });
    const timeFormatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    });
    return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
  };

  const startDate = new Date(match.start_time);
  const now = new Date();
  const isPastMatch = startDate < now;
  const displayStatus = isPastMatch ? 'finished' : match.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-900/50 text-green-300 border border-green-800";
      case "closed": return "bg-zinc-700 text-zinc-300 border border-zinc-600";
      case "canceled": return "bg-red-900/50 text-red-300 border border-red-800";
      case "finished": return "bg-gray-700 text-gray-300 border border-gray-600";
      default: return "bg-zinc-700 text-zinc-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return locale === "ko" ? "모집중" : "Open";
      case "closed": return locale === "ko" ? "마감" : "Closed";
      case "canceled": return locale === "ko" ? "취소됨" : "Canceled";
      case "finished": return locale === "ko" ? "경기완료" : "Finished";
      default: return status;
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 shadow-sm relative">
      <AdminNewBadge key={badgeKey} matchId={match.id} currentCount={totalParticipants} />

      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-zinc-100 break-keep">
            {locale === "ko"
              ? match.rink?.name_ko
              : match.rink?.name_en || match.rink?.name_ko}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {formatDate(match.start_time)}
          </p>
        </div>
        <div className="flex flex-col flex-none items-end gap-2 ml-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${getStatusColor(displayStatus)}`}>
            {getStatusText(displayStatus)}
          </span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
              match.match_type === "game"
                ? "bg-purple-900/50 text-purple-300 border border-purple-800"
                : match.match_type === "team_match"
                ? "bg-teal-900/50 text-teal-300 border border-teal-800"
                : "bg-zinc-700 text-zinc-300 border border-zinc-600"
            }`}
          >
            {tMatch(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Creator Info */}
      {match.creator && (
        <div className="mb-4 text-xs text-zinc-500 bg-zinc-900/30 p-2 rounded border border-zinc-800">
          <span className="text-zinc-400 font-medium">Created by: </span>
          {match.creator.full_name || match.creator.email}
        </div>
      )}

      {match.match_type === "team_match" ? (
        <div className="flex justify-center items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <span className="font-medium">
            {(match.participants_count.fw + match.participants_count.df + match.participants_count.g) >= match.max_skaters
              ? (locale === "ko" ? "매칭 완료" : "Matched")
              : (locale === "ko" ? "매칭 대기" : "Waiting for Opponent")
            }
          </span>
        </div>
      ) : (
        <div className="flex justify-between items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <span className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-1">Skater</span>
            <span className="font-medium">
              {match.participants_count.fw + match.participants_count.df}/{match.max_skaters}
            </span>
          </span>
          <div className="h-8 w-px bg-zinc-700"></div>
          <span className="flex flex-col items-center">
            <span className="text-xs text-zinc-500 mb-1">Goalie</span>
            <span className="font-medium">
              {match.participants_count.g}/{match.max_goalies}
            </span>
          </span>
        </div>
      )}

      <div className="space-y-3">
        <Link
            href={`/${locale}/admin/matches/${match.id}/edit`}
            className="block w-full py-2.5 text-center bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-600 transition-colors"
        >
            {t("matches.edit")}
        </Link>
        
        <button
          onClick={handleToggleParticipants}
          className="block w-full py-2.5 text-center bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
        >
          {showParticipants ? t("matches.hideParticipants") : t("matches.viewParticipants")}
        </button>
      </div>

      {showParticipants && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <AdminParticipantList participants={match.participants} matchType={match.match_type} />
        </div>
      )}
    </div>
  );
}
