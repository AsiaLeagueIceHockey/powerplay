import { getTranslations, setRequestLocale } from "next-intl/server";
import { getMatchesByWeek } from "@/app/actions/instagram";
import { paginateWeeklyMatches } from "@/lib/instagram-weekly-paginate";
import { InstagramWeeklyMatchCard } from "@/components/instagram-weekly-match-card";
import { InstagramWeeklyDayHeader } from "@/components/instagram-weekly-day-header";
import { Suspense } from "react";
import Image from "next/image";

export const metadata = {
  title: "PowerPlay - Weekly Instagram Capture",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * 오늘 KST 기준 다음 월요일 날짜를 YYYY-MM-DD 로 반환.
 * 일요일 21:00 KST cron 실행 시 다음날 월요일이 됨.
 */
function computeNextMondayKst(): string {
  const now = new Date();
  // KST 기준 시각으로 변환
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dow = kst.getUTCDay(); // 0=일, 1=월 ...
  // 다음 월요일까지 일수: 월(1)이면 7, 그 외엔 ((1 - dow + 7) % 7) (0이면 같은날 월이라 7)
  const daysUntilMon = dow === 1 ? 7 : (1 - dow + 7) % 7 || 7;
  const next = new Date(kst);
  next.setUTCDate(next.getUTCDate() + daysUntilMon);
  return next.toISOString().slice(0, 10);
}

/** 주의 마지막 날(일요일) 날짜를 weekStart 기준으로 계산. */
function computeWeekEndKst(weekStartStr: string): string {
  const start = new Date(weekStartStr + "T00:00:00+09:00");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const kst = new Date(end.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function InstagramWeeklyContent({
  locale,
  weekStart,
  page,
}: {
  locale: string;
  weekStart: string;
  page: string;
}) {
  const t = await getTranslations({ locale, namespace: "instagram.weekly" });
  const matches = await getMatchesByWeek(weekStart);
  const pages = paginateWeeklyMatches(matches, weekStart);

  const pageNum = parseInt(page, 10) || 1;
  const totalPages = pages.length;

  // 주의 마지막 날
  const weekEnd = computeWeekEndKst(weekStart);

  // 헤더용 날짜 범위 포맷
  const startDate = new Date(weekStart + "T00:00:00+09:00");
  const endDate = new Date(weekEnd + "T00:00:00+09:00");
  const dateRangeFormatter = new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
  const startParts = dateRangeFormatter.formatToParts(startDate);
  const endParts = dateRangeFormatter.formatToParts(endDate);
  const startMonth = startParts.find((p) => p.type === "month")?.value ?? "";
  const startDay = startParts.find((p) => p.type === "day")?.value ?? "";
  const endMonth = endParts.find((p) => p.type === "month")?.value ?? "";
  const endDay = endParts.find((p) => p.type === "day")?.value ?? "";
  const dateRangeLabel = t("dateRange", { startMonth, startDay, endMonth, endDay });

  // 페이지 매치 0건 (즉 totalPages === 0 => 매치 없음 시나리오)
  const isEmptyWeek = totalPages === 0;
  const currentPage = isEmptyWeek ? null : pages[pageNum - 1] ?? null;

  return (
    <div
      className="relative mx-auto flex flex-col items-center justify-start bg-[#ffffff] font-sans text-[#172554]"
      data-weekly-total-pages={totalPages}
      data-weekly-empty={isEmptyWeek ? "true" : "false"}
      style={{
        width: "1080px",
        // ▶ 짤림 방지 안전망 #1: minHeight 만 1920, height 고정 X, overflow visible.
        minHeight: "1920px",
        padding: "80px 70px",
      }}
    >
      <div className="absolute left-0 top-0 h-2 w-full bg-[#172554]" />

      {/* Header */}
      <div className="z-10 mb-16 flex w-full flex-none flex-col items-center">
        <div className="mb-6 flex items-center justify-center">
          <Image
            src="/long-logo.jpg"
            alt="PowerPlay Logo"
            width={380}
            height={130}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>

        <h2 className="text-[44px] font-black leading-tight tracking-tight text-[#172554]">
          {t("title")}
        </h2>
        <p className="mt-3 text-[26px] font-semibold text-zinc-500">{dateRangeLabel}</p>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center gap-3 rounded-full border border-zinc-100 bg-zinc-50 px-6 py-2 text-xl font-bold text-zinc-400">
            <span className="text-sm uppercase tracking-widest opacity-60">
              {t("pageIndicator")}
            </span>
            <span className="text-[#172554]">{pageNum}</span>
            <span className="text-zinc-200">/</span>
            <span className="text-zinc-400">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="z-10 flex w-full flex-1 flex-col">
        {isEmptyWeek ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border border-zinc-100 bg-zinc-50 p-20">
            <h3 className="mb-4 text-4xl font-black uppercase text-zinc-300 opacity-50">
              No Matches
            </h3>
            <p className="text-2xl font-medium tracking-tight text-zinc-400">
              {t("emptyWeek")}
            </p>
          </div>
        ) : currentPage === null ? (
          <div className="flex items-center justify-center text-2xl text-zinc-400">
            Page {pageNum} not found
          </div>
        ) : (
          <div className="flex flex-col">
            {currentPage.days.map((dayGroup, dayIdx) => (
              <div key={`${dayGroup.date}-${dayIdx}`}>
                {dayIdx > 0 && (
                  <div className="my-6 border-t border-zinc-200" />
                )}
                <InstagramWeeklyDayHeader
                  date={dayGroup.date}
                  matchCount={dayGroup.matches.length}
                />
                {dayGroup.isEmpty ? (
                  <div className="flex h-[50px] items-center justify-center text-lg font-medium text-zinc-300">
                    {t("empty")}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-4">
                    {dayGroup.matches.map((match) => (
                      <InstagramWeeklyMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer watermark */}
      <div className="z-10 mt-16 flex w-full flex-none flex-col items-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#172554] px-8 py-4 shadow-lg">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="text-2xl font-bold tracking-tight text-white">
            @powerplay.kr
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function InstagramWeeklyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ weekStart?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { weekStart, page } = await searchParams;

  setRequestLocale(locale);

  const targetWeekStart = weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
    ? weekStart
    : computeNextMondayKst();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-white text-3xl font-bold text-[#172554]">
          로딩 중...
        </div>
      }
    >
      <InstagramWeeklyContent
        locale={locale}
        weekStart={targetWeekStart}
        page={page || "1"}
      />
    </Suspense>
  );
}
