"use client";

import { badgeStyles, surfaceStyles } from "@/components/ui/styles";

import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";
import { Building2 } from "lucide-react";
import Image from "next/image";

export function MatchCard({ match }: { match: Match }) {
  const t = useTranslations("match");
  const locale = useLocale();
  const router = useRouter();

  const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
  const startDate = new Date(match.start_time);
  const formattedDate = dateFormatter.format(startDate);
  const kstStartDate = new Date(startDate.getTime() + 9 * 60 * 60 * 1000);
  const formattedTime = `${String(kstStartDate.getUTCHours()).padStart(2, "0")}:${String(kstStartDate.getUTCMinutes()).padStart(2, "0")}`;

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
  const matchHref = `/${locale}/match/${match.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(matchHref)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          router.push(matchHref);
        }
      }}
      className={`${surfaceStyles({ interactive: true, density: "compact" })} group relative block flex cursor-pointer flex-col overflow-hidden`}
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-[#172554] dark:bg-pp-accent" />

      {/* Header: Date & Status */}
      <div className="mb-3 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-[13px] font-bold">
          <span className="text-pp-muted whitespace-nowrap">{formattedDate}</span>
          <span className="text-pp-text font-normal">|</span>
          <span className="text-pp-navy dark:text-pp-accent-text whitespace-nowrap">{formattedTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {match.duration_minutes && (
            <span className={badgeStyles({ tone: "neutral" })}>
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
                ? "bg-pp-accent-soft text-pp-accent-text border-pp-accent "
                : match.match_type === "team_match"
                ? "bg-pp-info-soft text-pp-info-text border-pp-info-border "
                : "bg-pp-surface-muted text-pp-muted border-pp-border "
            }`}
          >
            {t(`types.${match.match_type || 'training'}`)}
          </span>
        </div>
      </div>

      {/* Rink Name & Address */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-pp-navy group-hover:text-pp-accent-text dark:text-pp-text leading-tight transition-colors">
          <Link
            href={`/match/${match.id}`}
            prefetch={false}
            className="relative z-10"
            onClick={(event) => event.stopPropagation()}
          >
            {rinkName || "Unknown Rink"}
          </Link>
        </h3>
        {match.rink?.address && (
          <p className="mt-0.5 text-[11px] font-medium text-pp-muted ">
            {match.rink.address.split(" ").slice(0, 2).join(" ")}
          </p>
        )}
      </div>

      {/* Position Availability */}
      <div className="mb-3 flex items-center justify-between gap-x-3 gap-y-2 flex-wrap min-h-[28px]">
        {match.match_type === "team_match" ? (
          <div className="text-[11px]">
            <span className={`rounded-lg px-2 py-0.5 font-bold border ${
              currentSkaters >= match.max_skaters
                ? "bg-pp-info-soft text-pp-info-text border-pp-info-border "
                : "bg-pp-warning-soft text-pp-warning-text border-pp-warning-border "
            }`}>
              {currentSkaters >= match.max_skaters ? t("teamJoined") : t("teamMatchWaiting")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-x-3 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-pp-muted ">{match.match_type === "training" ? t("guest") : t("skater")}</span>
              <span
                className={`rounded-lg px-1.5 py-0.5 font-black ${
                  (match.match_type === "training" ? (match.max_guests ? match.max_guests - currentSkaters > 0 : true) : remainingSkaters > 0)
                    ? "bg-pp-accent-soft text-pp-accent-text "
                    : "bg-pp-surface-muted text-pp-muted "
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
                <span className="font-bold text-pp-muted ">{t("position.G")}</span>
                <span
                  className={`rounded-lg px-1.5 py-0.5 font-black ${
                    remainingGoalies > 0
                      ? "bg-pp-accent-soft text-pp-accent-text "
                      : "bg-pp-surface-muted text-pp-muted "
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
          <span className={`${badgeStyles({ tone: "brand" })} ml-auto`}>
            + {t("rentalFee")} {match.rental_fee >= 0 ? `${match.rental_fee.toLocaleString()}원` : t("goalieFree")}
          </span>
        )}
      </div>

      {/* Footer: Club (Left) & Price (Right) */}
      <div className="mt-auto flex items-end justify-between border-t border-pp-border pt-3 ">
        {/* Club Info */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {match.club ? (
            <Link
              href={`/clubs/${match.club.id}`}
              prefetch={false}
              className="relative z-10 flex items-center gap-1.5 text-pp-accent-text truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {match.club.logo_url ? (
                <Image
                  src={match.club.logo_url}
                  alt={match.club.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded shrink-0 object-cover shadow-sm bg-pp-surface"
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
            <span className="text-[13px] font-bold text-pp-info-text ">
              {t("feeDescriptionRef")}
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-pp-navy dark:text-pp-text">
                {(match.entry_points || match.fee).toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-pp-muted ">
                {locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
