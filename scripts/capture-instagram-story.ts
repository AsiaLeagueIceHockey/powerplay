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

async function run() {
  console.log("Starting Instagram Story Capture...");

  // 1. Determine target date (from env or default to tomorrow in KST)
  let targetDateStr: string;

  if (process.env.TARGET_DATE) {
    targetDateStr = process.env.TARGET_DATE;
    console.log(`Using provided target date: ${targetDateStr}`);
  } else {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in ms
    const kstDate = new Date(now.getTime() + kstOffset);

    // Add 1 day for tomorrow
    kstDate.setDate(kstDate.getDate() + 1);
    targetDateStr = kstDate.toISOString().split("T")[0];
    console.log(`Using default target date (tomorrow): ${targetDateStr}`);
  }

  // 2. Fetch matches for tomorrow to determine total pages
  const startIso = new Date(targetDateStr + "T00:00:00+09:00").toISOString();

  const nextDate = new Date(targetDateStr + "T00:00:00+09:00");
  nextDate.setDate(nextDate.getDate() + 1);
  const endIso = nextDate.toISOString();

  const { count, error } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .gte("start_time", startIso)
    .lt("start_time", endIso)
    .neq("status", "canceled");

  if (error) {
    console.error("Error fetching match count:", error);
    process.exit(1);
  }

  const matchCount = count || 0;
  console.log(`Found ${matchCount} matches for tomorrow.`);

  if (matchCount === 0) {
    console.log("No matches for tomorrow. Exiting.");
    process.exit(0);
  }

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(matchCount / ITEMS_PER_PAGE);
  console.log(`Total Pages to capture: ${totalPages}`);

  // 3. Setup Playwright
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`\nCapturing Page ${pageNum}/${totalPages}...`);

      const context = await browser.newContext({
        viewport: { width: 1080, height: 1920 },
        deviceScaleFactor: 2, // Retina display quality
      });

      const page = await context.newPage();

      // Navigate to the capture page
      const url = `${SITE_URL}/ko/instagram/matches?date=${targetDateStr}&page=${pageNum}`;
      console.log(`Navigating to: ${url}`);

      // Wait for network idle to ensure everything (fonts, images) is loaded
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: true,
      });
      console.log(`Screenshot taken for page ${pageNum}.`);

      // Upload to Supabase Storage
      const fileName = `${targetDateStr}/story-${pageNum}.png`;
      console.log(`Uploading to Supabase: instagram-stories/${fileName}`);

      const { data, error: uploadError } = await supabase.storage
        .from("instagram-stories")
        .upload(fileName, screenshotBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload page ${pageNum}:`, uploadError);
      } else {
        console.log(`Successfully uploaded: ${data.path}`);

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("instagram-stories")
          .getPublicUrl(fileName);

        console.log(`Public URL: ${publicUrlData.publicUrl}`);
      }

      await context.close();
    }

    console.log("\nAll captures completed successfully!");
  } catch (error) {
    console.error("Capture failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
