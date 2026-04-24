import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmailNotification } from "@/lib/notifications/dispatch";

/**
 * D-1 경기 리마인더 발송 API
 * GitHub Actions cron이 매일 11:00 UTC (20:00 KST)에 호출
 * x-cron-secret 헤더로 인증
 */
export async function GET(request: NextRequest) {
  // 보안: CRON_SECRET 헤더 검증
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // KST 기준 내일 날짜 범위 계산 (UTC 기준 저장된 start_time과 비교)
    const now = new Date();
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffsetMs);

    const tomorrowKst = new Date(kstNow);
    tomorrowKst.setUTCDate(tomorrowKst.getUTCDate() + 1);

    // 내일 KST 00:00 ~ 23:59:59 를 UTC로 변환
    const tomorrowStartUtc = new Date(
      Date.UTC(
        tomorrowKst.getUTCFullYear(),
        tomorrowKst.getUTCMonth(),
        tomorrowKst.getUTCDate()
      ) - kstOffsetMs
    );
    const tomorrowEndUtc = new Date(tomorrowStartUtc.getTime() + 24 * 60 * 60 * 1000);

    // 내일 열리는 경기 조회 (취소/종료 제외)
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, start_time, rink:rinks(name_ko)")
      .gte("start_time", tomorrowStartUtc.toISOString())
      .lt("start_time", tomorrowEndUtc.toISOString())
      .not("status", "in", '("canceled","finished")');

    if (matchError) {
      console.error("[REMINDER] 경기 조회 실패:", matchError);
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ sent: 0, message: "내일 예정된 경기 없음" });
    }

    let sent = 0;
    let errors = 0;

    for (const match of matches) {
      // @ts-ignore
      const rinkName: string = match.rink?.name_ko || "경기장";
      const startTime = new Date(match.start_time).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Seoul",
      });

      // 확정 참가자 조회
      const { data: participants } = await supabase
        .from("participants")
        .select("user_id")
        .eq("match_id", match.id)
        .eq("status", "confirmed");

      if (!participants || participants.length === 0) continue;

      for (const p of participants) {
        try {
          await sendEmailNotification(
            p.user_id,
            "경기 D-1 리마인더 ⏰",
            `내일 경기가 예정되어 있습니다!\n\n📍 ${rinkName}\n🕐 ${startTime}\n\n준비물 챙기고 좋은 경기 하세요 🏒`,
            `/match/${match.id}`
          );
          sent++;
        } catch {
          errors++;
        }
      }
    }

    console.log(`[REMINDER] 완료 — 발송: ${sent}, 실패: ${errors}`);
    return NextResponse.json({ sent, errors, matches: matches.length });
  } catch (err) {
    console.error("[REMINDER] 예외:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
