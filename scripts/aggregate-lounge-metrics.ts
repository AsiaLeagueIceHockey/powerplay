/**
 * Lounge Metrics Daily Aggregation Script
 *
 * lounge_metrics(원본 로그)를 일별로 집계하여 lounge_daily_metrics에 UPSERT합니다.
 * - 아직 집계되지 않은 날짜의 데이터만 처리
 * - 최초 실행 시 전체 과거 데이터 마이그레이션 역할도 겸함
 * - 90일 이전 원본 로그 삭제 (선택)
 *
 * 실행: npx tsx scripts/aggregate-lounge-metrics.ts
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 옵션: DELETE_OLD_LOGS=true (90일 이전 로그 삭제 활성화)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DELETE_OLD_LOGS = process.env.DELETE_OLD_LOGS === "true";
const LOG_RETENTION_DAYS = 90;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface RawMetricRow {
  business_id: string;
  event_id: string | null;
  entity_type: "business" | "event";
  metric_type: "impression" | "click";
  cta_type: string | null;
  source: string | null;
  created_at: string;
}

interface DailyMetricsJson {
  business_impressions: number;
  business_clicks: number;
  event_impressions: Record<string, number>;
  event_clicks: Record<string, number>;
  home_banner_impressions: number;
  home_banner_clicks: number;
  cta_clicks: Record<string, number>;
  source_breakdown: Record<string, number>;
}

function toKstDateString(input: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(typeof input === "string" ? new Date(input) : input);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function getYesterdayKst(): string {
  // "오늘 KST 날짜 - 1일"을 구합니다.
  // toKstDateString이 KST 기준으로 변환하므로, 먼저 오늘 KST 날짜를 구하고 1일을 뺍니다.
  const todayKst = toKstDateString(new Date());
  const d = new Date(todayKst + "T00:00:00+09:00");
  d.setDate(d.getDate() - 1);
  return toKstDateString(d);
}

function emptyMetrics(): DailyMetricsJson {
  return {
    business_impressions: 0,
    business_clicks: 0,
    event_impressions: {},
    event_clicks: {},
    home_banner_impressions: 0,
    home_banner_clicks: 0,
    cta_clicks: { detail: 0, kakao: 0, instagram: 0, website: 0, phone: 0 },
    source_breakdown: {},
  };
}

function aggregateRows(rows: RawMetricRow[]): Map<string, Map<string, DailyMetricsJson>> {
  // Map<business_id, Map<date, DailyMetricsJson>>
  const result = new Map<string, Map<string, DailyMetricsJson>>();

  for (const row of rows) {
    const dateKey = toKstDateString(row.created_at);
    const bizId = row.business_id;

    if (!result.has(bizId)) result.set(bizId, new Map());
    const bizMap = result.get(bizId)!;

    if (!bizMap.has(dateKey)) bizMap.set(dateKey, emptyMetrics());
    const m = bizMap.get(dateKey)!;

    const isHomeBannerImpression = row.metric_type === "impression" && row.source === "home-banner-impression";
    const isHomeBannerClick = row.metric_type === "click" && row.source === "home-banner-click";

    // Source breakdown
    const srcKey = row.source ?? "direct";
    m.source_breakdown[srcKey] = (m.source_breakdown[srcKey] ?? 0) + 1;

    if (isHomeBannerImpression) {
      m.home_banner_impressions += 1;
    } else if (isHomeBannerClick) {
      m.home_banner_clicks += 1;
    } else if (row.metric_type === "impression") {
      if (row.event_id) {
        m.event_impressions[row.event_id] = (m.event_impressions[row.event_id] ?? 0) + 1;
      } else {
        m.business_impressions += 1;
      }
    } else {
      // click
      if (row.event_id) {
        m.event_clicks[row.event_id] = (m.event_clicks[row.event_id] ?? 0) + 1;
      } else {
        m.business_clicks += 1;
        // cta_clicks는 business click의 하위 분류만 저장 (event/banner CTA 제외)
        if (row.cta_type) {
          m.cta_clicks[row.cta_type] = (m.cta_clicks[row.cta_type] ?? 0) + 1;
        }
      }
    }
  }

  return result;
}

async function fetchAllRawMetrics(afterDate: string | null, beforeDateInclusive: string): Promise<RawMetricRow[]> {
  const PAGE_SIZE = 1000;
  const allRows: RawMetricRow[] = [];
  let offset = 0;

  // Convert KST date to UTC range for querying
  // afterDate (exclusive): start of that day KST = afterDate + "T00:00:00+09:00"
  // beforeDateInclusive: end of that day KST = beforeDate + "T23:59:59.999+09:00"
  const startUtc = afterDate ? `${afterDate}T15:00:00.000Z` : null; // afterDate 날짜의 KST 자정 = UTC 15:00 전날
  const endUtc = `${beforeDateInclusive}T14:59:59.999Z`; // beforeDate 날짜의 KST 23:59:59 = UTC 14:59:59

  while (true) {
    let query = supabase
      .from("lounge_metrics")
      .select("business_id, event_id, entity_type, metric_type, cta_type, source, created_at")
      .lte("created_at", endUtc)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (startUtc) {
      query = query.gt("created_at", startUtc);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching lounge_metrics:", error.message);
      break;
    }

    const rows = (data as RawMetricRow[]) ?? [];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

async function getLastAggregatedDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("lounge_daily_metrics")
    .select("date")
    .order("date", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].date;
}

async function upsertDailyMetrics(
  aggregated: Map<string, Map<string, DailyMetricsJson>>
): Promise<number> {
  let upsertCount = 0;

  for (const [businessId, dateMap] of aggregated) {
    const rows = [...dateMap.entries()].map(([date, metrics]) => ({
      business_id: businessId,
      date,
      metrics,
      updated_at: new Date().toISOString(),
    }));

    // Batch upsert in chunks of 100
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from("lounge_daily_metrics")
        .upsert(chunk, { onConflict: "business_id,date" });

      if (error) {
        console.error(`Upsert error for business ${businessId}:`, error.message);
      } else {
        upsertCount += chunk.length;
      }
    }
  }

  return upsertCount;
}

async function deleteOldLogs(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
  const cutoffIso = cutoffDate.toISOString();

  const { count, error } = await supabase
    .from("lounge_metrics")
    .delete({ count: "exact" })
    .lt("created_at", cutoffIso);

  if (error) {
    console.error("Error deleting old logs:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function run() {
  console.log("=== Lounge Metrics Daily Aggregation ===");
  console.log(`Time: ${new Date().toISOString()}`);

  const yesterday = getYesterdayKst();
  console.log(`Yesterday (KST): ${yesterday}`);

  // 1. Find last aggregated date
  const lastAggregated = await getLastAggregatedDate();
  console.log(`Last aggregated date: ${lastAggregated ?? "(none - first run)"}`);

  // 2. Fetch raw metrics that haven't been aggregated yet (up to yesterday)
  console.log(`Fetching raw metrics: ${lastAggregated ? `after ${lastAggregated}` : "all"} ~ ${yesterday}`);
  const rawRows = await fetchAllRawMetrics(lastAggregated, yesterday);
  console.log(`Fetched ${rawRows.length} raw metric rows`);

  if (rawRows.length === 0) {
    console.log("No new metrics to aggregate. Done.");
    return;
  }

  // 3. Aggregate
  const aggregated = aggregateRows(rawRows);
  const businessCount = aggregated.size;
  const dateCount = [...aggregated.values()].reduce((sum, m) => sum + m.size, 0);
  console.log(`Aggregated: ${businessCount} businesses, ${dateCount} business-date combinations`);

  // 4. Upsert to lounge_daily_metrics
  const upserted = await upsertDailyMetrics(aggregated);
  console.log(`Upserted ${upserted} daily metric rows`);

  // 5. Optionally delete old logs
  if (DELETE_OLD_LOGS) {
    console.log(`Deleting logs older than ${LOG_RETENTION_DAYS} days...`);
    const deleted = await deleteOldLogs();
    console.log(`Deleted ${deleted} old log rows`);
  } else {
    console.log(`Log deletion skipped (set DELETE_OLD_LOGS=true to enable)`);
  }

  console.log("=== Done ===");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
