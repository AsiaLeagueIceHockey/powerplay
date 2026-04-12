import type {
  LoungeEvent,
  LoungeMetricRow,
  LoungeMetricsSummary,
  LoungeDailyMetricPoint,
  LoungeEventMetricRow,
} from "@/app/actions/lounge";

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
