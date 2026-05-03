import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ───── 환경 변수 ─────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.SITE_URL || "https://powerplay.kr";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ───── 캡처 사양 ─────
const VIEWPORT_WIDTH = 1080;
const VIEWPORT_HEIGHT = 1920;
const DEVICE_SCALE_FACTOR = 2;
const MAX_HEIGHT_PX = VIEWPORT_HEIGHT * DEVICE_SCALE_FACTOR; // 사후 검증 한계

/** 오늘 KST 기준 다음 월요일 YYYY-MM-DD 반환 (capture 페이지의 computeNextMondayKst 와 동일 규칙). */
function computeNextMondayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dow = kst.getUTCDay();
  const daysUntilMon = dow === 1 ? 7 : (1 - dow + 7) % 7 || 7;
  const next = new Date(kst);
  next.setUTCDate(next.getUTCDate() + daysUntilMon);
  return next.toISOString().slice(0, 10);
}

async function run() {
  console.log("Starting Weekly Instagram Story Capture...");

  // 1. 캡처 대상 주의 시작일 결정
  let weekStart: string;
  if (process.env.TARGET_WEEK_START) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(process.env.TARGET_WEEK_START)) {
      console.error(
        `Invalid TARGET_WEEK_START format: ${process.env.TARGET_WEEK_START}. Expected YYYY-MM-DD.`
      );
      process.exit(1);
    }
    weekStart = process.env.TARGET_WEEK_START;
    console.log(`Using provided TARGET_WEEK_START: ${weekStart}`);
  } else {
    weekStart = computeNextMondayKst();
    console.log(`Using default (next Monday KST): ${weekStart}`);
  }

  // 2. 7일 범위 매치 조회로 페이지 수 계산
  const startIso = new Date(weekStart + "T00:00:00+09:00").toISOString();
  const endDate = new Date(weekStart + "T00:00:00+09:00");
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  const endIso = endDate.toISOString();

  const { count, error: countError } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .gte("start_time", startIso)
    .lt("start_time", endIso)
    .neq("status", "canceled");

  if (countError) {
    console.error("Error fetching weekly match count:", countError);
    process.exit(1);
  }

  const matchCount = count ?? 0;
  console.log(`Found ${matchCount} matches for week ${weekStart}.`);

  // 3. 매치 0개 시 빈 주 알림만 보내고 종료
  if (matchCount === 0) {
    console.log("No matches this week. Sending empty-week Slack notification.");
    await sendEmptyWeekSlack(weekStart);
    process.exit(0);
  }

  // 4. 페이지 1을 먼저 로드해 data-weekly-total-pages 속성에서 totalPages 추출.
  //    페이지네이션 로직을 캡처 스크립트와 페이지 양쪽에서 중복 유지보수하지 않기 위함.
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const uploadedUrls: string[] = [];
  const siteHost = new URL(SITE_URL).hostname;

  // 컨텍스트 생성 헬퍼 — 매번 새 컨텍스트로 깨끗한 환경 보장 (locale/cookie 강제)
  const newKoContext = async () => {
    const context = await browser.newContext({
      viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      locale: "ko-KR",
      extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9" },
    });
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "ko", domain: siteHost, path: "/" },
      { name: "powerplay-locale-preference", value: "ko", domain: siteHost, path: "/" },
    ]);
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("powerplay-locale-preference", "ko");
      } catch {
        // ignore
      }
    });
    return context;
  };

  let totalPages = 0;
  try {
    // 페이지 1 로드 → totalPages 추출
    const probeContext = await newKoContext();
    const probePage = await probeContext.newPage();
    const probeUrl = `${SITE_URL}/ko/instagram/weekly-matches?weekStart=${weekStart}&page=1`;
    console.log(`Probing totalPages from: ${probeUrl}`);
    await probePage.goto(probeUrl, { waitUntil: "networkidle", timeout: 30000 });

    const probeMeta = await probePage.evaluate(() => {
      const root = document.querySelector(
        "[data-weekly-total-pages]"
      ) as HTMLElement | null;
      if (!root) return { totalPages: 0, empty: true };
      return {
        totalPages: parseInt(root.dataset.weeklyTotalPages ?? "0", 10),
        empty: root.dataset.weeklyEmpty === "true",
      };
    });
    await probeContext.close();

    if (probeMeta.empty || probeMeta.totalPages === 0) {
      console.log("Probe reported empty week. Sending empty-week Slack notification.");
      await sendEmptyWeekSlack(weekStart);
      await browser.close();
      process.exit(0);
    }

    totalPages = probeMeta.totalPages;
    console.log(`Total Pages to capture: ${totalPages}`);

    // 5. 페이지별 캡처
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`\nCapturing Page ${pageNum}/${totalPages}...`);

      const context = await newKoContext();
      const page = await context.newPage();

      const url = `${SITE_URL}/ko/instagram/weekly-matches?weekStart=${weekStart}&page=${pageNum}`;
      console.log(`Navigating to: ${url}`);

      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: true,
      });
      console.log(`Screenshot taken for page ${pageNum}.`);

      // ▶ 짤림 방지 안전망 #4: 사후 검증 — PNG height ≤ 1920 (DSR=2 → 3840) 강제 검사
      const meta = await sharp(screenshotBuffer).metadata();
      const actualHeight = meta.height ?? 0;
      if (actualHeight > MAX_HEIGHT_PX) {
        throw new Error(
          `Page ${pageNum} exceeds height budget: ${actualHeight}px > ${MAX_HEIGHT_PX}px (DSR=${DEVICE_SCALE_FACTOR}). ` +
            `Pagination algorithm produced an oversized page. Fix src/lib/instagram-weekly-paginate.ts.`
        );
      }
      console.log(
        `Height check OK: ${actualHeight}px <= ${MAX_HEIGHT_PX}px (DSR=${DEVICE_SCALE_FACTOR}).`
      );

      // 업로드: instagram-stories/weekly/{weekStart}/page-{n}.png
      const fileName = `weekly/${weekStart}/page-${pageNum}.png`;
      console.log(`Uploading to Supabase: instagram-stories/${fileName}`);

      const { data, error: uploadError } = await supabase.storage
        .from("instagram-stories")
        .upload(fileName, screenshotBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload page ${pageNum}:`, uploadError);
        throw new Error(
          `Upload failed for page ${pageNum}/${totalPages}: ${uploadError.message}`
        );
      }
      console.log(`Successfully uploaded: ${data.path}`);

      const { data: publicUrlData } = supabase.storage
        .from("instagram-stories")
        .getPublicUrl(fileName);

      console.log(`Public URL: ${publicUrlData.publicUrl}`);
      uploadedUrls.push(publicUrlData.publicUrl);

      await context.close();
    }

    console.log("\nAll captures completed successfully!");
    await sendSlackNotification(weekStart, uploadedUrls);
  } catch (err) {
    console.error("Capture failed:", err);
    await sendFailureSlack(weekStart, err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// ───── Slack: 캡처 성공 ─────
async function sendSlackNotification(weekStart: string, urls: string[]) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not set; skipping Slack notification.");
    return;
  }
  if (urls.length === 0) return;

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📅 ${weekStart} 주간 경기 인스타 스토리 (${urls.length}장)`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "이미지를 길게 눌러 저장 후 인스타그램 스토리 캐러셀로 업로드하세요.",
        },
      ],
    },
  ];

  urls.forEach((url, i) => {
    blocks.push({
      type: "image",
      image_url: url,
      alt_text: `Page ${i + 1}`,
      title: { type: "plain_text", text: `Page ${i + 1}/${urls.length}` },
    });
  });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Slack notification failed: ${res.status} ${body}`);
    } else {
      console.log("Slack notification sent.");
    }
  } catch (err) {
    console.error("Slack notification error:", err);
  }
}

// ───── Slack: 빈 주 알림 ─────
async function sendEmptyWeekSlack(weekStart: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not set; skipping empty-week notification.");
    return;
  }

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📅 ${weekStart} 주간 경기 — 이번 주 일정 없음`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "이번 주는 등록된 경기가 없어 인스타 캐러셀을 생성하지 않았습니다.",
        },
      ],
    },
  ];

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Empty-week Slack failed: ${res.status} ${body}`);
    } else {
      console.log("Empty-week Slack sent.");
    }
  } catch (err) {
    console.error("Empty-week Slack error:", err);
  }
}

// ───── Slack: 실패 알림 ─────
async function sendFailureSlack(weekStart: string, err: unknown) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message =
    err instanceof Error ? `${err.message}\n\`\`\`${err.stack ?? ""}\`\`\`` : String(err);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `❌ ${weekStart} 주간 경기 캡처 실패`,
              emoji: true,
            },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: message.slice(0, 2900) },
          },
        ],
      }),
    });
  } catch (e) {
    console.error("Failure Slack error:", e);
  }
}

run();
