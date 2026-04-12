import type {
  LoungeEvent,
  LoungeMetricRow,
  LoungeMetricsSummary,
  LoungeDailyMetricPoint,
  LoungeEventMetricRow,
} from "@/app/actions/lounge";

/**
 * lounge_daily_metrics.metrics JSONB 구조
 */
export interface DailyMetricsJson {
  business_impressions: number;
  business_clicks: number;
  event_impressions: Record<string, number>;
  event_clicks: Record<string, number>;
  home_banner_impressions: number;
  home_banner_clicks: number;
  cta_clicks: Record<string, number>;
  source_breakdown: Record<string, number>;
}

export interface DailyMetricsRow {
  business_id: string;
  date: string;
  metrics: DailyMetricsJson;
}

/**
 * lounge_daily_metrics의 JSONB를 LoungeMetricRow[] 형태로 변환합니다.
 * 기존 buildMetricsSummary, buildDailyMetricPoints가 수정 없이 동작하도록 합니다.
 */
export function dailyMetricsToRows(dailyRows: DailyMetricsRow[]): LoungeMetricRow[] {
  const result: LoungeMetricRow[] = [];

  for (const { date, metrics: m } of dailyRows) {
    const ts = `${date}T12:00:00+09:00`; // KST noon (날짜 기준 유지용)

    // Business impressions
    for (let i = 0; i < (m.business_impressions ?? 0); i++) {
      result.push({ metric_type: "impression", cta_type: null, event_id: null, source: null, created_at: ts });
    }

    // Business clicks — CTA 클릭은 business_clicks의 하위 분류이므로,
    // business_clicks row에 cta_type을 직접 붙여서 생성합니다.
    // buildMetricsSummary에서 click row는 businessClicks++과 ctaClicks[cta_type]++ 양쪽에 카운트됩니다.
    const ctaEntries = Object.entries(m.cta_clicks ?? {});
    let ctaTotal = 0;
    for (const [ctaType, count] of ctaEntries) {
      for (let i = 0; i < count; i++) {
        result.push({ metric_type: "click", cta_type: ctaType as LoungeMetricRow["cta_type"], event_id: null, source: null, created_at: ts });
      }
      ctaTotal += count;
    }
    // business_clicks 중 CTA가 아닌 나머지 (cta_type이 null인 클릭)
    const nonCtaClicks = Math.max(0, (m.business_clicks ?? 0) - ctaTotal);
    for (let i = 0; i < nonCtaClicks; i++) {
      result.push({ metric_type: "click", cta_type: null, event_id: null, source: null, created_at: ts });
    }

    // Event impressions
    for (const [eventId, count] of Object.entries(m.event_impressions ?? {})) {
      for (let i = 0; i < count; i++) {
        result.push({ metric_type: "impression", cta_type: null, event_id: eventId, source: null, created_at: ts });
      }
    }

    // Event clicks
    for (const [eventId, count] of Object.entries(m.event_clicks ?? {})) {
      for (let i = 0; i < count; i++) {
        result.push({ metric_type: "click", cta_type: null, event_id: eventId, source: null, created_at: ts });
      }
    }

    // Home banner impressions
    for (let i = 0; i < (m.home_banner_impressions ?? 0); i++) {
      result.push({ metric_type: "impression", cta_type: null, event_id: null, source: "home-banner-impression", created_at: ts });
    }

    // Home banner clicks
    for (let i = 0; i < (m.home_banner_clicks ?? 0); i++) {
      result.push({ metric_type: "click", cta_type: null, event_id: null, source: "home-banner-click", created_at: ts });
    }
  }

  return result;
}

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

export function buildMetricsSummary(rows: LoungeMetricRow[]): LoungeMetricsSummary {
  const summary: LoungeMetricsSummary = {
    businessImpressions: 0,
    businessClicks: 0,
    eventImpressions: 0,
    eventClicks: 0,
    homeBannerImpressions: 0,
    homeBannerClicks: 0,
    ctaClicks: {
      phone: 0,
      kakao: 0,
      instagram: 0,
      website: 0,
      detail: 0,
    },
    sourceBreakdown: {},
  };

  rows.forEach((row) => {
    const isEvent = !!row.event_id;
    const isHomeBannerImpression = row.metric_type === "impression" && row.source === "home-banner-impression";
    const isHomeBannerClick = row.metric_type === "click" && row.source === "home-banner-click";

    if (row.source) {
      summary.sourceBreakdown[row.source] = (summary.sourceBreakdown[row.source] ?? 0) + 1;
    }

    if (isHomeBannerImpression) {
      summary.homeBannerImpressions += 1;
      return;
    }

    if (isHomeBannerClick) {
      summary.homeBannerClicks += 1;
      return;
    }

    if (row.metric_type === "impression") {
      if (isEvent) summary.eventImpressions += 1;
      else summary.businessImpressions += 1;
      return;
    }

    if (isEvent) summary.eventClicks += 1;
    else summary.businessClicks += 1;

    if (row.cta_type) {
      summary.ctaClicks[row.cta_type] += 1;
    }
  });

  return summary;
}

export function buildDailyMetricPoints(rows: LoungeMetricRow[]): LoungeDailyMetricPoint[] {
  const map = new Map<string, LoungeDailyMetricPoint>();

  rows.forEach((row) => {
    const dateKey = toKstDateKey(row.created_at);
    const current = map.get(dateKey) ?? {
      date: dateKey,
      impressions: 0,
      clicks: 0,
    };

    if (row.metric_type === "impression") current.impressions += 1;
    else current.clicks += 1;

    map.set(dateKey, current);
  });

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildEventMetricRows(events: LoungeEvent[], rows: LoungeMetricRow[]): LoungeEventMetricRow[] {
  const map = new Map<string, LoungeEventMetricRow>();

  events.forEach((event) => {
    map.set(event.id, {
      eventId: event.id,
      title: event.title,
      startTime: event.start_time,
      impressions: 0,
      clicks: 0,
      ctr: 0,
    });
  });

  rows.forEach((row) => {
    if (!row.event_id) return;
    const current = map.get(row.event_id);
    if (!current) return;

    if (row.metric_type === "impression") current.impressions += 1;
    else current.clicks += 1;
  });

  return [...map.values()]
    .map((item) => ({
      ...item,
      ctr: item.impressions > 0 ? Number(((item.clicks / item.impressions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.impressions !== a.impressions) return b.impressions - a.impressions;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
}
