/** 발신자 주소 — 발신 전용 (회신 inbox 없음) */
export const FROM_EMAIL = "PowerPlay <noreply@powerplay.kr>";

/**
 * 이메일 CTA 등 절대 URL 생성에 사용할 앱 호스트.
 * NEXT_PUBLIC_APP_URL 이 비어있거나 누락되어도 powerplay.kr 로 fallback.
 * (과거: env 미설정으로 "http:///match/xxx" 깨진 링크 발송 이슈 방지)
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    return raw.replace(/\/+$/, ""); // 끝 슬래시 제거
  }
  return "https://powerplay.kr";
}
