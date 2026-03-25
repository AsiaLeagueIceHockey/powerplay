"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";
import { Building2 } from "lucide-react";
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
    open: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    closed: "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700",
    canceled: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    finished: "bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800/20 dark:text-zinc-500 dark:border-zinc-800",
  };

  const counts = match.participants_count || { fw: 0, df: 0, g: 0 };
  const currentSkaters = counts.fw + counts.df;
  const remainingSkaters = Math.max(0, match.max_skaters - currentSkaters);
  const remainingGoalies = Math.max(0, match.max_goalies - counts.g);

  return (
    <div
      className="group relative block flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400 overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-[#172554] dark:bg-blue-600" />

      {/* Header: Date & Status */}
      <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] font-bold">
          <span className="text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{formattedDate}</span>
          <span className="text-zinc-200 dark:text-zinc-700 font-normal">|</span>
          <span className="text-[#172554] dark:text-blue-400 whitespace-nowrap">{formattedTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {match.duration_minutes && (
            <span className="whitespace-nowrap inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
              {match.duration_minutes}{locale === "ko" ? "분" : "m"}
            </span>
          )}
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight border ${statusColors[displayStatus]}`}
          >
            {t(`status.${displayStatus}`)}
          </span>
          <span
            className={`whitespace-nowrap inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-bold border ${
              match.match_type === "game"
                ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                : match.match_type === "team_match"
                ? "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800"
                : "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700"
            }`}
          >
            {t(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Rink Name & Address */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-[#172554] group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 leading-tight transition-colors">
          <Link href={`/match/${match.id}`} className="relative z-10">
            {rinkName || "Unknown Rink"}
          </Link>
        </h3>
        {match.rink?.address && (
          <p className="mt-0.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            {match.rink.address.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
        <Link
          href={`/match/${match.id}`}
          className="relative z-10 mt-2 inline-flex text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {locale === "ko" ? "경기 상세 보기" : "View match details"}
        </Link>
      </div>

      {/* Position Availability */}
      <div className="mb-3 flex items-center justify-between gap-x-3 gap-y-2 flex-wrap min-h-[28px]">
        {match.match_type === "team_match" ? (
          <div className="text-[11px]">
            <span className={`rounded-lg px-2 py-0.5 font-bold border ${
              currentSkaters >= match.max_skaters
                ? "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800"
                : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
            }`}>
              {currentSkaters >= match.max_skaters ? t("teamJoined") : t("teamMatchWaiting")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-x-3 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-400 dark:text-zinc-500">{match.match_type === "training" ? t("guest") : t("skater")}</span>
              <span
                className={`rounded-lg px-1.5 py-0.5 font-black ${
                  (match.match_type === "training" ? (match.max_guests ? match.max_guests - currentSkaters > 0 : true) : remainingSkaters > 0)
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
              >
                {match.match_type === "training" 
                  ? (match.max_guests ? `${currentSkaters}/${match.max_guests}` : `${currentSkaters}/${t("guestUnlimited")}`)
                  : `${currentSkaters}/${match.max_skaters}`
                }
              </span>
            </div>
            {match.match_type !== "training" && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-400 dark:text-zinc-500">{t("position.G")}</span>
                <span
                  className={`rounded-lg px-1.5 py-0.5 font-black ${
                    remainingGoalies > 0
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  {counts.g}/{match.max_goalies}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Rental Badge aligned to right */}
        {match.rental_available && (
          <span className="ml-auto whitespace-nowrap inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 shadow-sm">
            + {t("rentalFee")} {match.rental_fee >= 0 ? `${match.rental_fee.toLocaleString()}원` : t("goalieFree")}
          </span>
        )}
      </div>

      {/* Footer: Club (Left) & Price (Right) */}
      <div className="mt-auto flex items-end justify-between border-t border-zinc-50 pt-3 dark:border-zinc-800/50">
        {/* Club Info */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {match.club ? (
            <Link
              href={`/clubs/${match.club.id}`}
              className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-[#172554] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 px-2 py-0.5 rounded-lg border border-blue-100/50 dark:border-blue-900/20 truncate hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              {match.club.logo_url ? (
                <Image 
                  src={match.club.logo_url} 
                  alt={match.club.name} 
                  width={16} 
                  height={16} 
                  unoptimized
                  className="w-4 h-4 rounded shrink-0 object-cover shadow-sm bg-white"
                />
              ) : (
                <Building2 className="h-3 w-3 shrink-0 opacity-80" />
              )}
              <span className="truncate">{match.club.name}</span>
            </Link>
          ) : (
            <div className="h-6" /> /* Spacer */
          )}
        </div>

        {/* Price Info */}
        <div className="flex flex-col items-end gap-0.5">
          {match.match_type === "team_match" ? (
            <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">
              {t("feeDescriptionRef")}
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#172554] dark:text-zinc-100">
                {(match.entry_points || match.fee).toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                {locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
