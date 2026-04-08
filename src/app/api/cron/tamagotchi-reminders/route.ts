import { NextRequest, NextResponse } from "next/server";
import { dispatchDueTamagotchiReminderJobs } from "@/lib/tamagotchi-reminders";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await dispatchDueTamagotchiReminderJobs();
  return NextResponse.json(result, { status: result.success ? 200 : 503 });
}
