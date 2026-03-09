"use client";

import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";
import { Building2 } from "lucide-react";
import Image from "next/image";

export function InstagramMatchCard({ match }: { match: Match }) {
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
    open: "bg-emerald-100 text-emerald-800 border-emerald-200",
    closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
    canceled: "bg-red-100 text-red-800 border-red-200",
    finished: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  return (
    <div className="flex flex-col rounded-[40px] border border-zinc-200 bg-white p-9 relative overflow-hidden transition-all duration-300 shadow-xl">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-[#172554]"></div>
      
      {/* Header: Date & Status */}
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="shrink truncate text-xl font-bold text-zinc-500">
          {formattedDate} <span className="text-zinc-300 mx-1.5">|</span> <span className="text-[#172554]">{formattedTime}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {match.duration_minutes && (
            <span className="whitespace-nowrap inline-block rounded-xl px-3 py-1 text-[14px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-200">
              {match.duration_minutes}{locale === "ko" ? "분" : "m"}
            </span>
          )}
          <span
            className={`whitespace-nowrap rounded-full px-4 py-1 text-[14px] font-bold tracking-wide border ${statusColors[displayStatus]}`}
          >
            {t(`status.${displayStatus}`)}
          </span>
          <span
            className={`whitespace-nowrap inline-block rounded-xl px-3 py-1 text-[14px] font-bold border ${
              match.match_type === "game"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : match.match_type === "team_match"
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-zinc-50 text-zinc-600 border-zinc-200"
            }`}
          >
            {t(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Rink Name & Address */}
      <div className="mb-8">
        <h3 className="text-[42px] font-extrabold text-[#172554] leading-tight tracking-tight mb-2">
          {rinkName || "Unknown Rink"}
        </h3>
        {match.rink?.address && (
          <p className="text-xl font-medium text-zinc-400">
            {match.rink.address.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
      </div>

      {/* Footer Line: Club (Left) & Fee (Right) */}
      <div className="mt-auto flex items-end justify-between pt-6 border-t border-zinc-100">
        {/* Club Info */}
        <div className="flex flex-col gap-3">
          {match.club ? (
            <div className="flex items-center gap-3 text-xl font-bold text-[#172554] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              {match.club.logo_url ? (
                <Image 
                  src={match.club.logo_url} 
                  alt={match.club.name} 
                  width={28} 
                  height={28} 
                  className="w-7 h-7 rounded-lg object-cover bg-white"
                />
              ) : (
                <Building2 className="h-6 w-6 opacity-80" />
              )}
              <span>{match.club.name}</span>
            </div>
          ) : (
            <div className="h-[44px]"></div> /* Placeholder for alignment if no club */
          )}
        </div>

        {/* Fee Info - Moved to Right Bottom as requested */}
        <div className="flex flex-col items-end gap-2">
          {match.match_type === "team_match" ? (
            <span className="text-2xl font-extrabold text-[#0d9488]">
              {t("feeDescriptionRef")}
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[34px] font-black text-[#172554]">
                  {(match.entry_points || match.fee).toLocaleString()}
                </span>
                <span className="text-xl font-bold text-zinc-400">{locale === "ko" ? "원" : "KRW"}</span>
              </div>
              {match.rental_available && (
                <span className="mt-1 text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shadow-sm">
                  + {t("rentalFee")} {match.rental_fee >= 0 ? `${match.rental_fee.toLocaleString()}원` : t("goalieFree")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
