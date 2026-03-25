type LoungeExternalUrlType = "kakao" | "instagram" | "website";

const NAVER_MAP_HOSTS = new Set(["naver.me", "map.naver.com"]);
const KAKAO_HOSTS = new Set(["open.kakao.com", "pf.kakao.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]+$/;

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

function normalizeInstagramHandle(input: string) {
  const normalized = input.trim().replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  return INSTAGRAM_HANDLE_PATTERN.test(normalized) ? normalized : null;
}

function normalizeInstagramUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return { value: null };
  }

  const prefixedUrl = /^(?:www\.|m\.)?instagram\.com\//i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;
  const parsed = parseUrl(prefixedUrl);

  if (!parsed) {
    const handle = normalizeInstagramHandle(trimmed);
    if (!handle) {
      return { value: null, error: "Instagram URL must use instagram.com or @handle" };
    }

    return { value: `https://www.instagram.com/${handle}/` };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { value: null, error: "Instagram URL must use http:// or https:// or @handle" };
  }

  if (!INSTAGRAM_HOSTS.has(parsed.hostname.toLowerCase())) {
    return { value: null, error: "Instagram URL must use instagram.com" };
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  const usernameFromQuery = parsed.searchParams.get("username");

  if (pathSegments[0] === "_u" && pathSegments[1]) {
    const handle = normalizeInstagramHandle(pathSegments[1]);
    if (handle) {
      return { value: `https://www.instagram.com/${handle}/` };
    }
  }

  if (pathSegments[0] === "accounts" && usernameFromQuery) {
    const handle = normalizeInstagramHandle(usernameFromQuery);
    if (handle) {
      return { value: `https://www.instagram.com/${handle}/` };
    }
  }

  if (pathSegments.length === 1) {
    const handle = normalizeInstagramHandle(pathSegments[0]);
    if (handle) {
      return { value: `https://www.instagram.com/${handle}/` };
    }
  }

  const normalizedPath =
    parsed.pathname === "/" || parsed.pathname.endsWith("/")
      ? parsed.pathname
      : `${parsed.pathname}/`;

  return { value: `https://www.instagram.com${normalizedPath}` };
}

export function sanitizeLoungeExternalUrl(
  url: string | null | undefined,
  type: LoungeExternalUrlType
): { value: string | null; error?: string } {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { value: null };
  }

  if (type === "instagram") {
    return normalizeInstagramUrl(trimmed);
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
