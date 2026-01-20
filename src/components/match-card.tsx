"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";
import { Users, Building2 } from "lucide-react";
import Image from "next/image";

export function MatchCard({ match }: { match: Match }) {
  const t = useTranslations("match");
  const locale = useLocale();

  const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const startDate = new Date(match.start_time);
  const formattedDate = dateFormatter.format(startDate);
  const formattedTime = timeFormatter.format(startDate);

  // KST 기준 과거 경기 체크
  const now = new Date();
  const isPastMatch = startDate < now;

  // 과거 경기면 'finished'로 오버라이드
  const displayStatus = isPastMatch ? 'finished' : match.status;

  const statusColors: Record<string, string> = {
    open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    closed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    finished: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };

  const counts = match.participants_count || { fw: 0, df: 0, g: 0 };
  const currentSkaters = counts.fw + counts.df;
  const remainingSkaters = match.max_skaters - currentSkaters;
  const remainingGoalies = match.max_goalies - counts.g;

  return (
    <Link
      href={`/match/${match.id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Header: Date & Status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {formattedDate} · {formattedTime}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[displayStatus]}`}
        >
          {t(`status.${displayStatus}`)}
        </span>
      </div>

      {/* Rink Name */}
      <h3 className="mb-1 text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {rinkName || "Unknown Rink"}
      </h3>

      {/* Club Name with Logo */}
      {match.club && (
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
          {match.club.logo_url ? (
            <Image 
              src={match.club.logo_url} 
              alt={match.club.name} 
              width={20} 
              height={20} 
              className="w-5 h-5 rounded object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          {match.club.name}
        </div>
      )}

      {/* Position Availability */}
      <div className="mb-3 flex gap-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("skater")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              remainingSkaters > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {remainingSkaters}/{match.max_skaters}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("position.G")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              remainingGoalies > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {remainingGoalies}/{match.max_goalies}
          </span>
        </div>
      </div>

      {/* Fee */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("fee")}: {(match.entry_points || match.fee).toLocaleString()}P
      </div>
    </Link>
  );
}
