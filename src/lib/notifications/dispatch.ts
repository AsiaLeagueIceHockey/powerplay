import { createClient } from "@/lib/supabase/server";
import { FROM_EMAIL, buildEmailAbsoluteUrl } from "./resend-client";
import { renderEmailHtml } from "./templates";
import { toEmailSubject } from "./email-subject";

/**
 * 이메일 알림 발송 + notification_logs에 channel='email'로 기록
 * 실패해도 절대 throw하지 않음 — push/비즈니스 로직에 영향 없어야 함
 */
export async function sendEmailNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  // RESEND_API_KEY 미설정 시 조용히 skip (env 추가 전 배포 안전 처리)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY 미설정 — 이메일 발송 생략");
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const supabase = await createClient();

    // 수신자 이메일 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      console.warn(`[EMAIL] userId ${userId} 의 이메일을 찾을 수 없어 발송 생략`);
      return;
    }

    const absoluteUrl = url ? buildEmailAbsoluteUrl(url) : undefined;
    const emailSubject = toEmailSubject(title);

    const html = renderEmailHtml(emailSubject, body, absoluteUrl);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: emailSubject,
      html,
    });

    if (error) {
      console.error("[EMAIL] Resend 발송 실패:", error);
    }

    // notification_logs 기록 (channel = 'email')
    await supabase.from("notification_logs").insert({
      user_id: userId,
      title,
      body,
      url: url ?? "",
      status: error ? "failed" : "sent",
      devices_sent: error ? 0 : 1,
      error_message: error ? JSON.stringify(error) : null,
      channel: "email",
    });
  } catch (err) {
    // 이메일 실패가 상위 로직을 절대 깨지 않도록 catch
    console.error("[EMAIL] sendEmailNotification 예외:", err);
  }
}
