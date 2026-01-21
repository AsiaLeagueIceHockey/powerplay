"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MyMatch } from "@/app/actions/mypage";

interface MyMatchListProps {
  matches: MyMatch[];
}

type TabType = "upcoming" | "past";

export function MyMatchList({ matches }: MyMatchListProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const now = new Date();

  // Filter and sort matches
  const upcomingMatches = matches
    .filter((m) => new Date(m.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastMatches = matches
    .filter((m) => new Date(m.start_time) <= now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const activeMatches = activeTab === "upcoming" ? upcomingMatches : pastMatches;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === "ko") {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "waiting":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getPaymentColor = (paid: boolean) => {
    return paid
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "upcoming"
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          {locale === "ko" ? "신청 내역 / 예정" : "Upcoming"}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            {upcomingMatches.length}
          </span>
          {activeTab === "upcoming" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "past"
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          {locale === "ko" ? "지난 경기" : "Past Matches"}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            {pastMatches.length}
          </span>
          {activeTab === "past" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {activeMatches.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              {activeTab === "upcoming"
                ? (locale === "ko" ? "예정된 경기가 없습니다." : "No upcoming matches.")
                : (locale === "ko" ? "지난 경기 내역이 없습니다." : "No past matches found.")}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
              >
                {locale === "ko" ? "경기 둘러보기" : "Browse Matches"}
              </Link>
            )}
          </div>
        ) : (
          activeMatches.map((match) => (
            <Link
              key={match.participation.id}
              href={`/match/${match.id}`}
              className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="font-bold text-lg text-zinc-900 dark:text-white mb-1">
                    {locale === "ko"
                      ? match.rink?.name_ko || "미정"
                      : match.rink?.name_en || match.rink?.name_ko || "TBD"}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2">
                    <span>📅 {formatDate(match.start_time)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Position Badge */}
                  <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold uppercase">
                    {t(`match.position.${match.participation.position}`)}
                  </span>

                  {/* Payment Badge */}
                  {(match.participation.status === "confirmed" || match.participation.status === "applied") && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getPaymentColor(
                        match.participation.payment_status
                      )}`}
                    >
                      {match.participation.payment_status
                        ? t("participant.payment.paid")
                        : t("participant.payment.unpaid")}
                    </span>
                  )}

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
                      match.participation.status
                    )}`}
                  >
                    {t(`participant.status.${match.participation.status}`)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
