"use client";

import type {
  LoungeBusiness,
  LoungeDailyMetricPoint,
  LoungeEventMetricRow,
  LoungeMetricsSummary,
} from "@/app/actions/lounge";

const pathClickKeys = [
  { key: "detail", labelKo: "상세 이동", labelEn: "Detail" },
  { key: "kakao", labelKo: "카카오", labelEn: "Kakao" },
  { key: "instagram", labelKo: "인스타그램", labelEn: "Instagram" },
  { key: "website", labelKo: "웹사이트", labelEn: "Website" },
  { key: "phone", labelKo: "전화", labelEn: "Phone" },
] as const;

export function LoungePerformancePanel({
  locale,
  business,
  metrics,
  dailyMetrics,
  eventMetrics,
  emptyTitle,
  emptyDescription,
  onEmptyActionLabel,
  onEmptyAction,
}: {
  locale: string;
  business: LoungeBusiness | null;
  metrics: LoungeMetricsSummary;
  dailyMetrics: LoungeDailyMetricPoint[];
  eventMetrics: LoungeEventMetricRow[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyActionLabel?: string;
  onEmptyAction?: () => void;
}) {
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

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: locale === "ko" ? "비즈니스 노출" : "Business impressions", value: metrics.businessImpressions },
          { label: locale === "ko" ? "비즈니스 클릭" : "Business clicks", value: metrics.businessClicks },
          { label: locale === "ko" ? "일정 노출" : "Event impressions", value: metrics.eventImpressions },
          { label: locale === "ko" ? "일정 클릭" : "Event clicks", value: metrics.eventClicks },
          { label: locale === "ko" ? "홈 배너 노출" : "Home banner impressions", value: metrics.homeBannerImpressions },
          { label: locale === "ko" ? "홈 배너 클릭" : "Home banner clicks", value: metrics.homeBannerClicks },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
            <p className="text-sm text-zinc-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-zinc-50">{item.value}</p>
          </div>
        ))}
      </section>

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
            {locale === "ko" ? "최근 7일 노출/클릭" : "Last 7 days"}
          </h2>
          <div className="mt-4 space-y-3">
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
