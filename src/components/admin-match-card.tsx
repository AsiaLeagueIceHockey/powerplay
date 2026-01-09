"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminParticipantList } from "./admin-participant-list";

interface Match {
  id: string;
  start_time: string;
  status: "open" | "closed" | "canceled";
  rink: {
    name_ko: string;
    name_en: string;
  } | null;
  participants: any[]; // Using any for simplicity in props, keeping it flexible
  participants_count: {
    fw: number;
    df: number;
    g: number;
  };
  max_fw: number;
  max_df: number;
  max_g: number;
  fee: number;
}

export function AdminMatchCard({
  match,
  locale,
}: {
  match: Match;
  locale: string;
}) {
  const [showParticipants, setShowParticipants] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "ko") {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-900/50 text-green-300 border border-green-800";
      case "closed":
        return "bg-zinc-700 text-zinc-300 border border-zinc-600";
      case "canceled":
        return "bg-red-900/50 text-red-300 border border-red-800";
      default:
        return "bg-zinc-700 text-zinc-300";
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-100">
            {locale === "ko"
              ? match.rink?.name_ko
              : match.rink?.name_en || match.rink?.name_ko}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {formatDate(match.start_time)}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(
            match.status
          )}`}
        >
          {match.status === "open"
            ? "모집중"
            : match.status === "closed"
            ? "마감"
            : "취소됨"}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm text-zinc-300 mb-6 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
        <span className="flex flex-col items-center">
          <span className="text-xs text-zinc-500 mb-1">FW</span>
          <span className="font-medium">
            {match.participants_count.fw}/{match.max_fw}
          </span>
        </span>
        <div className="h-8 w-px bg-zinc-700"></div>
        <span className="flex flex-col items-center">
          <span className="text-xs text-zinc-500 mb-1">DF</span>
          <span className="font-medium">
            {match.participants_count.df}/{match.max_df}
          </span>
        </span>
        <div className="h-8 w-px bg-zinc-700"></div>
        <span className="flex flex-col items-center">
          <span className="text-xs text-zinc-500 mb-1">G</span>
          <span className="font-medium">
            {match.participants_count.g}/{match.max_g}
          </span>
        </span>
      </div>

      <div className="space-y-3">
        <Link
          href={`/${locale}/admin/matches/${match.id}/edit`}
          className="block w-full py-2.5 text-center bg-zinc-100 dark:bg-zinc-200 text-zinc-900 rounded-lg text-sm font-bold hover:bg-white transition-colors"
        >
          수정
        </Link>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="block w-full py-2.5 text-center bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
        >
          {showParticipants ? "참가자 목록 닫기 ▲" : "참가자 목록 확인 ▼"}
        </button>
      </div>

      {showParticipants && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <AdminParticipantList participants={match.participants} />
        </div>
      )}
    </div>
  );
}
