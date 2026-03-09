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
    <Link
      href={`/match/${match.id}`}
      className="group relative block flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:border-blue-500 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400 overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-[#172554] dark:bg-blue-600" />

      {/* Header: Date & Status */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="shrink truncate text-sm font-bold text-zinc-400 dark:text-zinc-500">
          {formattedDate} <span className="mx-1 text-zinc-200 dark:text-zinc-700">|</span> <span className="text-[#172554] dark:text-blue-400">{formattedTime}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {match.duration_minutes && (
            <span className="whitespace-nowrap inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
              {match.duration_minutes}{locale === "ko" ? "분" : "m"}
            </span>
          )}
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight border ${statusColors[displayStatus]}`}
          >
            {t(`status.${displayStatus}`)}
          </span>
          <span
            className={`whitespace-nowrap inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold border ${
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
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#172554] group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 leading-tight transition-colors">
          {rinkName || "Unknown Rink"}
        </h3>
        {match.rink?.address && (
          <p className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {match.rink.address.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
      </div>

      {/* Position Availability */}
      {match.match_type === "team_match" ? (
        <div className="mb-4 text-xs">
          <span className={`rounded-lg px-2 py-1 font-bold ${
            currentSkaters >= match.max_skaters
              ? "bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800"
              : "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          }`}>
            {currentSkaters >= match.max_skaters ? t("teamJoined") : t("teamMatchWaiting")}
          </span>
        </div>
      ) : (
        <div className="mb-4 flex gap-3 text-[13px]">
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

      {/* Footer: Club (Left) & Price (Right) */}
      <div className="mt-auto flex items-end justify-between border-t border-zinc-50 pt-4 dark:border-zinc-800/50">
        {/* Club Info */}
        <div className="flex items-center gap-2">
          {match.club ? (
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#172554] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 px-2.5 py-1 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
              {match.club.logo_url ? (
                <Image 
                  src={match.club.logo_url} 
                  alt={match.club.name} 
                  width={18} 
                  height={18} 
                  className="w-4.5 h-4.5 rounded object-cover shadow-sm"
                />
              ) : (
                <Building2 className="h-3.5 w-3.5 opacity-80" />
              )}
              <span className="truncate max-w-[120px]">{match.club.name}</span>
            </div>
          ) : (
            <div className="h-7" /> /* Spacer */
          )}
        </div>

        {/* Price Info */}
        <div className="flex flex-col items-end gap-1">
          {match.match_type === "team_match" ? (
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
              {t("feeDescriptionRef")}
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#172554] dark:text-zinc-100">
                  {(match.entry_points || match.fee).toLocaleString()}
                </span>
                <span className="text-[13px] font-bold text-zinc-400 dark:text-zinc-500">
                  {locale === "ko" ? "원" : "KRW"}
                </span>
              </div>
              {match.rental_available && (
                <span className="whitespace-nowrap inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                  + {t("rentalFee")} {match.rental_fee >= 0 ? `${match.rental_fee.toLocaleString()}원` : t("goalieFree")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
