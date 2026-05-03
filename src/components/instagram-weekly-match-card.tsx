"use client";

import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";
import { Building2 } from "lucide-react";
import Image from "next/image";

/**
 * 주간 캐러셀용 컴팩트 매치 카드.
 *
 * spec (§5.2):
 * - min-h-[130px] max-h-[150px] overflow-hidden  ← 카드 단일 클램프 (짤림 방지 안전망 #2)
 * - 표시: 시간 / 링크명 / 매치타입 뱃지 / 클럽(있으면) / 참가비
 * - 일일 카드보다 padding/font 모두 컴팩트화
 */
export function InstagramWeeklyMatchCard({ match }: { match: Match }) {
  const t = useTranslations("match");
  const locale = useLocale();

  const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en;
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

  const startDate = new Date(match.start_time);
  const formattedTime = timeFormatter.format(startDate);

  // 주간은 미래 일정만 다루지만, 안전망: 과거면 finished 로 오버라이드
  const now = new Date();
  const isPastMatch = startDate < now;
  const displayStatus = isPastMatch ? "finished" : match.status;

  // 매치 타입별 컬러 dot
  const typeDotColor =
    match.match_type === "game"
      ? "bg-purple-500"
      : match.match_type === "team_match"
      ? "bg-teal-500"
      : "bg-zinc-400"; // training

  return (
    <div className="relative flex min-h-[130px] max-h-[150px] w-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white px-6 py-4 shadow-sm">
      {/* 좌측 상단 액센트 바 */}
      <div className="absolute left-0 top-0 h-[4px] w-full bg-[#172554]" />

      {/* 1행: 시간 · 매치 타입 dot+라벨 · (open 만) 모집중 뱃지 */}
      <div className="mt-1 flex items-center gap-3">
        <span className="whitespace-nowrap text-2xl font-extrabold tracking-tight text-[#172554]">
          {formattedTime}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${typeDotColor}`} />
          <span className="text-sm font-semibold text-zinc-500">
            {t(`types.${match.match_type || "training"}`)}
          </span>
        </span>
        {displayStatus === "open" && (
          <span className="ml-auto whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700">
            {t("status.open")}
          </span>
        )}
      </div>

      {/* 2행: 링크명 (큰 폰트, truncate) */}
      <div className="mt-1.5 min-w-0">
        <h3 className="truncate text-[28px] font-extrabold leading-tight tracking-tight text-[#172554]">
          {rinkName || "Unknown Rink"}
        </h3>
      </div>

      {/* 3행: 클럽(좌) + 참가비(우) inline */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        {match.club ? (
          <div className="flex min-w-0 items-center gap-2">
            {match.club.logo_url ? (
              <Image
                src={match.club.logo_url}
                alt={match.club.name}
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 shrink-0 rounded-md bg-white object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 shrink-0 text-zinc-400" />
            )}
            <span className="truncate text-base font-bold text-[#172554]">
              {match.club.name}
            </span>
          </div>
        ) : (
          <span className="text-base font-medium text-zinc-300">·</span>
        )}

        {match.match_type === "team_match" ? (
          <span className="whitespace-nowrap text-xl font-extrabold text-[#0d9488]">
            {t("feeDescriptionRef")}
          </span>
        ) : (
          <span className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-2xl font-black text-[#172554]">
              {(match.entry_points || match.fee).toLocaleString()}
            </span>
            <span className="text-sm font-bold text-zinc-400">
              {locale === "ko" ? "원" : "KRW"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
