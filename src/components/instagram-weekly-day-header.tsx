"use client";

import { useTranslations, useLocale } from "next-intl";

/**
 * 주간 인스타 페이지의 날짜 그룹 헤더.
 *
 * spec (§5.3):
 * - 높이 ~60px (paginate 알고리즘 픽셀 예산과 일치)
 * - 좌측: "월 5/6" / 우측: "3경기" 또는 "휴식"
 * - bottom border 없음 (분기선이 그 역할)
 */
export function InstagramWeeklyDayHeader({
  date,
  matchCount,
}: {
  /** YYYY-MM-DD KST */
  date: string;
  matchCount: number;
}) {
  const t = useTranslations("instagram.weekly");
  const locale = useLocale();

  // KST 자정 기준 Date 객체 생성
  const kstDate = new Date(date + "T00:00:00+09:00");
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });

  // ko: "5월 6일 (월)" 식으로 나오므로 직접 구성
  const parts = formatter.formatToParts(kstDate);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  // 한국어: "월 5/6" / 영어: "Mon 5/6"
  const dateLabel = locale === "ko" ? `${weekday} ${month}/${day}` : `${weekday} ${month}/${day}`;
  const countLabel = matchCount === 0 ? t("dayHeader.rest") : t("dayHeader.matches", { count: matchCount });

  return (
    <div className="flex h-[60px] w-full items-center justify-between">
      <span className="text-3xl font-extrabold tracking-tight text-[#172554]">
        {dateLabel}
      </span>
      <span className="text-xl font-semibold text-zinc-400">
        {countLabel}
      </span>
    </div>
  );
}
