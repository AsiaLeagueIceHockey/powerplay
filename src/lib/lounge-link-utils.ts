type LoungeExternalUrlType = "kakao" | "instagram" | "website";

const NAVER_MAP_HOSTS = new Set(["naver.me", "map.naver.com"]);
const KAKAO_HOSTS = new Set(["open.kakao.com", "pf.kakao.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);

function parseUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function isAllowedNaverMapUrl(url: string) {
  const parsed = parseUrl(url.trim());
  if (!parsed) return false;
  return NAVER_MAP_HOSTS.has(parsed.hostname);
}

export function sanitizeLoungeExternalUrl(
  url: string | null | undefined,
  type: LoungeExternalUrlType
): { value: string | null; error?: string } {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { value: null };
  }

  const parsed = parseUrl(trimmed);
  if (!parsed) {
    return { value: null, error: "URL must be valid" };
  }

  if (type === "website") {
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { value: null, error: "Website URL must use http:// or https://" };
    }
  } else if (parsed.protocol !== "https:") {
    return { value: null, error: "URL must use https://" };
  }

  if (type === "kakao" && !KAKAO_HOSTS.has(parsed.hostname)) {
    return { value: null, error: "Kakao URL must use an approved Kakao host" };
  }

  if (type === "instagram" && !INSTAGRAM_HOSTS.has(parsed.hostname)) {
    return { value: null, error: "Instagram URL must use instagram.com" };
  }

  return { value: parsed.toString() };
}

export function sanitizeLoungeActionUrl(
  ctaType: "phone" | "kakao" | "instagram" | "website",
  url: string | null | undefined
) {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return null;

  if (ctaType === "phone") {
    if (!trimmed.startsWith("tel:")) return null;
    return trimmed;
  }

  const result = sanitizeLoungeExternalUrl(trimmed, ctaType);
  return result.value;
}
