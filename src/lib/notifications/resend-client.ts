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

/**
 * 이메일 CTA 절대 URL 빌더 — locale 이 없는 경로에 기본 `/ko` 접두사를 붙인다.
 * - path 가 http(s) 면 그대로 반환
 * - path 가 이미 `/ko/...` 또는 `/en/...` 이면 locale 을 존중
 * - path 가 `/...` 이지만 locale 이 없으면 `/ko` 를 prepend
 * - path 미지정 시 `${host}/ko` 를 반환
 * (과거: `/admin` 으로 보내 앱 i18n 미들웨어가 무한 리다이렉트 루프 일으킨 이슈 방지)
 */
export function buildEmailAbsoluteUrl(path?: string): string {
  const host = getAppUrl();
  if (!path) return `${host}/ko`;
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (/^\/(ko|en)(\/|$)/.test(normalized)) {
    return `${host}${normalized}`;
  }
  return `${host}/ko${normalized === "/" ? "" : normalized}`;
}
