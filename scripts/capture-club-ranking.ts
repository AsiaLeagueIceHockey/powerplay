import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SITE_URL = process.env.SITE_URL || "https://powerplay.kr";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ClubVoteTotalRow {
  club_id: string;
  vote_count: number | string | null;
}

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function getKstParts(date: Date): { year: number; month: number; day: number; lastDay: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  // last day of the same KST month
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const lastDayDate = new Date(nextMonthDate.getTime() - 24 * 60 * 60 * 1000);
  const lastDay = lastDayDate.getUTCDate();
  return { year, month, day, lastDay };
}

function kstMonthKey(date: Date): string {
  const { year, month } = getKstParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year}년 ${month}월`;
}

async function run() {
  console.log("Starting Instagram Club Ranking Capture...");

  // 1. Determine target month
  const envTargetMonth = process.env.TARGET_MONTH?.trim();
  const isManualRun = Boolean(envTargetMonth);

  let targetMonth: string;
  if (envTargetMonth) {
    if (!MONTH_KEY_REGEX.test(envTargetMonth)) {
      console.error(`Invalid TARGET_MONTH format: ${envTargetMonth} (expected YYYY-MM)`);
      process.exit(1);
    }
    targetMonth = envTargetMonth;
    console.log(`Using provided target month (manual): ${targetMonth}`);
  } else {
    targetMonth = kstMonthKey(new Date());
    console.log(`Using default target month (KST current month): ${targetMonth}`);
  }

  // 2. Last-day guard (skipped on manual workflow_dispatch)
  if (!isManualRun) {
    const { day, lastDay } = getKstParts(new Date());
    if (day !== lastDay) {
      console.log(
        `Today is KST day ${day}, not the last day of month (${lastDay}). Skipping (cron safeguard).`
      );
      process.exit(0);
    }
    console.log(`Today is KST last day of month (${day}/${lastDay}); proceeding.`);
  }

  // 3. Vote count guard — skip capture if no votes for the month
  const { data: voteTotals, error: voteError } = await supabase.rpc(
    "get_public_club_vote_totals",
    { target_month_kst: targetMonth }
  );

  if (voteError) {
    console.error("Failed to fetch vote totals:", voteError);
    process.exit(1);
  }

  const totalsRows = (voteTotals ?? []) as ClubVoteTotalRow[];
  const totalVotes = totalsRows.reduce(
    (acc, row) => acc + Number(row.vote_count ?? 0),
    0
  );

  if (totalsRows.length === 0 || totalVotes === 0) {
    console.log(`No cheer votes for ${targetMonth}. Skipping capture.`);
    await sendSlackEmptyNotice(targetMonth);
    process.exit(0);
  }

  console.log(
    `Found ${totalsRows.length} club(s) with votes (total ${totalVotes}). Capturing…`
  );

  // 4. Setup Playwright
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const siteHost = new URL(SITE_URL).hostname;

  try {
    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 2,
      locale: "ko-KR",
      extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9" },
    });

    await context.addCookies([
      { name: "NEXT_LOCALE", value: "ko", domain: siteHost, path: "/" },
      {
        name: "powerplay-locale-preference",
        value: "ko",
        domain: siteHost,
        path: "/",
      },
    ]);

    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("powerplay-locale-preference", "ko");
      } catch {
        // ignore storage errors
      }
    });

    const page = await context.newPage();
    const url = `${SITE_URL}/ko/instagram/club-ranking?month=${targetMonth}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });
    console.log(`Screenshot taken for ${targetMonth}.`);

    // 5. Upload to Supabase Storage
    const fileName = `club-ranking/${targetMonth}.png`;
    console.log(`Uploading to Supabase: instagram-stories/${fileName}`);

    const { data, error: uploadError } = await supabase.storage
      .from("instagram-stories")
      .upload(fileName, screenshotBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload club ranking story:", uploadError);
      throw new Error(
        `Upload failed for ${targetMonth}: ${uploadError.message}`
      );
    }

    console.log(`Successfully uploaded: ${data.path}`);

    const { data: publicUrlData } = supabase.storage
      .from("instagram-stories")
      .getPublicUrl(fileName);

    console.log(`Public URL: ${publicUrlData.publicUrl}`);

    await context.close();
    await sendSlackNotification(targetMonth, publicUrlData.publicUrl);

    console.log("\nCapture completed successfully.");
  } catch (error) {
    console.error("Capture failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

async function sendSlackNotification(monthKey: string, publicUrl: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("SLACK_WEBHOOK_URL not set; skipping Slack notification.");
    return;
  }

  const monthLabel = buildMonthLabel(monthKey);

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🏆 ${monthLabel} 응원 랭킹 TOP 5 (인스타 스토리)`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "이미지를 길게 눌러 저장 후 인스타그램 스토리에 업로드하세요.",
        },
      ],
    },
    {
      type: "image",
      image_url: publicUrl,
      alt_text: `${monthLabel} 응원 랭킹`,
      title: { type: "plain_text", text: `${monthLabel} 응원 랭킹` },
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
      console.error(`Slack notification failed: ${res.status} ${body}`);
    } else {
      console.log("Slack notification sent.");
    }
  } catch (err) {
    console.error("Slack notification error:", err);
  }
}

async function sendSlackEmptyNotice(monthKey: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(
      "SLACK_WEBHOOK_URL not set; skipping Slack empty-state notification."
    );
    return;
  }

  const monthLabel = buildMonthLabel(monthKey);

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📭 ${monthLabel} 응원 데이터가 없어 캡처를 건너뜁니다.`,
      },
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
      console.error(
        `Slack empty-state notification failed: ${res.status} ${body}`
      );
    } else {
      console.log("Slack empty-state notification sent.");
    }
  } catch (err) {
    console.error("Slack empty-state notification error:", err);
  }
}

run();
