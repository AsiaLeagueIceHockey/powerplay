"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type {
  LoungeBusiness,
  LoungeEvent,
  LoungeMetricRow,
} from "@/app/actions/lounge";
import {
  buildMetricsSummary,
  buildDailyMetricPoints,
  buildEventMetricRows,
} from "@/lib/lounge-metrics";

const pathClickKeys = [
  { key: "detail", labelKo: "상세 이동", labelEn: "Detail" },
  { key: "kakao", labelKo: "카카오", labelEn: "Kakao" },
  { key: "instagram", labelKo: "인스타그램", labelEn: "Instagram" },
  { key: "website", labelKo: "웹사이트", labelEn: "Website" },
  { key: "phone", labelKo: "전화", labelEn: "Phone" },
] as const;

type DatePreset = "all" | "7d" | "30d" | "custom";

function toKstDateKey(input: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return toKstDateKey(date);
}

const metricTooltips: Record<string, { ko: string; en: string }> = {
  businessImpressions: {
    ko: "사용자가 라운지 목록 페이지를 방문했을 때, 비즈니스 카드가 화면에 표시된 횟수입니다. 같은 사용자가 같은 날 여러 번 방문해도 1회로 집계됩니다.",
    en: "Number of times your business card was displayed on the lounge list page. Multiple visits by the same user in one session count as 1.",
  },
  businessClicks: {
    ko: "라운지 목록에서 비즈니스 카드를 클릭하여 상세 페이지로 이동한 횟수입니다. 모든 클릭이 집계됩니다.",
    en: "Number of clicks on your business card to view the detail page. Every click is counted.",
  },
  eventImpressions: {
    ko: "등록한 일정(레슨, 대회 등) 카드가 라운지 일정 탭에서 사용자에게 표시된 횟수입니다. 같은 사용자는 같은 일정에 대해 1회로 집계됩니다.",
    en: "Number of times your event cards were displayed in the lounge schedule tab. Same user sees the same event once per session.",
  },
  eventClicks: {
    ko: "일정 카드를 클릭하여 상세 내용을 확인한 횟수입니다. 모든 클릭이 집계됩니다.",
    en: "Number of clicks on event cards to view details. Every click is counted.",
  },
  homeBannerImpressions: {
    ko: "홈 화면 상단 배너 영역에서 비즈니스 배너가 사용자에게 표시된 횟수입니다. 배너가 슬라이드될 때마다 집계되며, 같은 사용자는 1회로 집계됩니다.",
    en: "Number of times your banner was displayed in the home page carousel. Same user counts once per session.",
  },
  homeBannerClicks: {
    ko: "홈 배너를 클릭하여 비즈니스 상세 페이지로 이동한 횟수입니다. 모든 클릭이 집계됩니다.",
    en: "Number of clicks on your home banner to visit the detail page. Every click is counted.",
  },
};

function MetricTooltip({ tooltipKey, locale }: { tooltipKey: string; locale: string }) {
  const [open, setOpen] = useState(false);
  const tooltip = metricTooltips[tooltipKey];
  if (!tooltip) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="ml-1 inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <span className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-zinc-600 bg-zinc-900 p-3 text-xs leading-5 text-zinc-300 shadow-xl">
          {locale === "ko" ? tooltip.ko : tooltip.en}
        </span>
      ) : null}
    </span>
  );
}

export function LoungePerformancePanel({
  locale,
  business,
  rawMetrics,
  events,
  emptyTitle,
  emptyDescription,
  onEmptyActionLabel,
  onEmptyAction,
}: {
  locale: string;
  business: LoungeBusiness | null;
  rawMetrics: LoungeMetricRow[];
  events: LoungeEvent[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyActionLabel?: string;
  onEmptyAction?: () => void;
}) {
  const today = toKstDateKey(new Date());
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startDate, endDate } = useMemo(() => {
    if (preset === "7d") return { startDate: daysAgo(7), endDate: today };
    if (preset === "30d") return { startDate: daysAgo(30), endDate: today };
    if (preset === "custom" && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return { startDate: null, endDate: null };
  }, [preset, customStart, customEnd, today]);

  const filteredRows = useMemo(() => {
    if (!startDate || !endDate) return rawMetrics;
    return rawMetrics.filter((row) => {
      const dateKey = toKstDateKey(row.created_at);
      return dateKey >= startDate && dateKey <= endDate;
    });
  }, [rawMetrics, startDate, endDate]);

  const metrics = useMemo(() => buildMetricsSummary(filteredRows), [filteredRows]);
  const dailyMetrics = useMemo(() => buildDailyMetricPoints(filteredRows), [filteredRows]);
  const eventMetrics = useMemo(() => buildEventMetricRows(events ?? [], filteredRows), [events, filteredRows]);

  const periodLabel = useMemo(() => {
    if (preset === "all") return locale === "ko" ? "전체 기간" : "All time";
    if (preset === "7d") return locale === "ko" ? "최근 7일" : "Last 7 days";
    if (preset === "30d") return locale === "ko" ? "최근 30일" : "Last 30 days";
    if (customStart && customEnd) return `${customStart} ~ ${customEnd}`;
    return locale === "ko" ? "직접 선택" : "Custom";
  }, [preset, customStart, customEnd, locale]);

  const presetOptions: { id: DatePreset; labelKo: string; labelEn: string }[] = [
    { id: "all", labelKo: "전체", labelEn: "All" },
    { id: "7d", labelKo: "최근 7일", labelEn: "7 days" },
    { id: "30d", labelKo: "최근 30일", labelEn: "30 days" },
    // daily 메트릭을 그대로 공개하기엔 리스크가 있어, 해당 기능은 유보
    // { id: "custom", labelKo: "직접 선택", labelEn: "Custom" },
  ];

  if (!business) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-800 p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-zinc-100">
          {emptyTitle || (locale === "ko" ? "먼저 비즈니스 정보를 등록해주세요" : "Create your business profile first")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {emptyDescription ||
            (locale === "ko"
              ? "비즈니스 정보가 있어야 라운지 노출과 클릭 데이터를 확인할 수 있습니다."
              : "Performance data appears after your business profile is ready.")}
        </p>
        {onEmptyAction && onEmptyActionLabel ? (
          <button
            type="button"
            onClick={onEmptyAction}
            className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950"
          >
            {onEmptyActionLabel}
          </button>
        ) : null}
      </section>
    );
  }

  const summaryCards: { label: string; tooltipKey: string; value: number }[] = [
    { label: locale === "ko" ? "비즈니스 노출" : "Business impressions", tooltipKey: "businessImpressions", value: metrics.businessImpressions },
    { label: locale === "ko" ? "비즈니스 클릭" : "Business clicks", tooltipKey: "businessClicks", value: metrics.businessClicks },
    { label: locale === "ko" ? "일정 노출" : "Event impressions", tooltipKey: "eventImpressions", value: metrics.eventImpressions },
    { label: locale === "ko" ? "일정 클릭" : "Event clicks", tooltipKey: "eventClicks", value: metrics.eventClicks },
    { label: locale === "ko" ? "홈 배너 노출" : "Home banner impressions", tooltipKey: "homeBannerImpressions", value: metrics.homeBannerImpressions },
    { label: locale === "ko" ? "홈 배너 클릭" : "Home banner clicks", tooltipKey: "homeBannerClicks", value: metrics.homeBannerClicks },
  ];

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {presetOptions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${preset === p.id
                ? "border-amber-400 bg-amber-400 text-zinc-950"
                : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
            >
              {locale === "ko" ? p.labelKo : p.labelEn}
            </button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
            <span className="text-zinc-500">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
        ) : null}
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.tooltipKey} className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
            <p className="text-sm text-zinc-400">
              {item.label}
              <MetricTooltip tooltipKey={item.tooltipKey} locale={locale} />
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-zinc-50">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Contact path + Daily metrics */}
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? "연락 경로 클릭 수" : "Contact clicks"}
          </h2>
          <div className="mt-4 space-y-3">
            {pathClickKeys.map((item) => (
              <div key={item.key} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-200">
                    {locale === "ko" ? item.labelKo : item.labelEn}
                  </p>
                  <p className="text-lg font-black text-zinc-50">{metrics.ctaClicks[item.key]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-100">
            {locale === "ko" ? `${periodLabel} 노출/클릭` : `${periodLabel} views/clicks`}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {locale === "ko"
              ? "비즈니스 + 일정 + 홈 배너의 모든 노출, 모든 클릭의 합산입니다."
              : "Sum of business, event, and home banner impressions and all clicks."}
          </p>
          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {dailyMetrics.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {locale === "ko" ? "아직 집계된 데이터가 없습니다." : "No data yet."}
              </p>
            ) : (
              dailyMetrics.map((item) => (
                <div key={item.date} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-200">{item.date}</p>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>
                        {locale === "ko" ? "노출" : "Views"} <strong className="text-zinc-100">{item.impressions}</strong>
                      </span>
                      <span>
                        {locale === "ko" ? "클릭" : "Clicks"} <strong className="text-zinc-100">{item.clicks}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Event performance */}
      <section className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-100">
          {locale === "ko" ? "일정별 노출/클릭" : "Event performance"}
        </h2>
        <div className="mt-4 space-y-3">
          {eventMetrics.length === 0 ? (
            <p className="text-sm text-zinc-400">
              {locale === "ko" ? "등록된 일정 또는 집계 데이터가 없습니다." : "No events or metrics yet."}
            </p>
          ) : (
            eventMetrics.slice(0, 6).map((item) => (
              <div key={item.eventId} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-100">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{item.startTime.slice(0, 16).replace("T", " ")}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400">
                  <span>
                    {locale === "ko" ? "노출" : "Views"} <strong className="text-zinc-100">{item.impressions}</strong>
                  </span>
                  <span>
                    {locale === "ko" ? "클릭" : "Clicks"} <strong className="text-zinc-100">{item.clicks}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
