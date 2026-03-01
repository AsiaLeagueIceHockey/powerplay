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
  const remainingSkaters = Math.max(0, match.max_skaters - currentSkaters);
  const remainingGoalies = Math.max(0, match.max_goalies - counts.g);

  return (
    <Link
      href={`/match/${match.id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Header: Date & Status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {formattedDate} · {formattedTime}
          {match.duration_minutes && (
            <span className="ml-1 text-xs font-normal text-zinc-400 dark:text-zinc-500">
              ({match.duration_minutes}{locale === "ko" ? "분" : "m"})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[displayStatus]}`}
          >
            {t(`status.${displayStatus}`)}
          </span>
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
              match.match_type === "game"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : match.match_type === "team_match"
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {t(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Rink Name & Address */}
      <div className="mb-2">
        <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
          {rinkName || "Unknown Rink"}
        </h3>
        {match.rink?.address && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {match.rink.address.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
      </div>

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
      {match.match_type === "team_match" ? (
        <div className="mb-3 text-sm">
          <span className={`rounded px-2 py-1 font-medium ${
            currentSkaters >= match.max_skaters
              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {currentSkaters >= match.max_skaters ? t("teamJoined") : t("teamMatchWaiting")}
          </span>
        </div>
      ) : match.match_type === "training" ? (
        <div className="mb-3 flex gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{t("guest")}</span>
            <span
              className={`rounded px-1.5 py-0.5 ${
                match.max_guests
                  ? (match.max_guests - currentSkaters > 0
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {match.max_guests
                ? `${currentSkaters}/${match.max_guests}`
                : `${currentSkaters}/${t("guestUnlimited")}`
              }
            </span>
          </div>
        </div>
      ) : (
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
      )}

      {/* Fee */}
      <div className="flex items-center gap-2 text-sm">
        {match.match_type === "team_match" ? (
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            {t("feeDescriptionRef")}
          </span>
        ) : (
          <>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">
              {(match.entry_points || match.fee).toLocaleString()} {locale === "ko" ? "원" : "KRW"}
            </span>
            {match.rental_available && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                (+ {t("rentalFee")} {match.rental_fee >= 0 ? `${match.rental_fee.toLocaleString()} ${locale === "ko" ? "원" : "KRW"}` : t("goalieFree")})
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
