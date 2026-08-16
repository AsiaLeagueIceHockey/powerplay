const NOTICE_IMAGE_MARKER = "/storage/v1/object/public/club-logos/";
const NOTICE_IMAGE_ROOT = "lounge/notices/";

export const LOUNGE_NOTICE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function buildLoungeNoticeImagePrefix(businessId: string): string {
  return `${NOTICE_IMAGE_ROOT}${businessId}/`;
}

export function extractLoungeNoticeImagePath(
  imageUrl: string | null | undefined,
  expectedPublicBaseUrl?: string
): string | null {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    if (expectedPublicBaseUrl) {
      const expectedUrl = new URL(expectedPublicBaseUrl);
      if (url.origin !== expectedUrl.origin) return null;
    } else if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
      return null;
    }
    if (!url.pathname.startsWith(NOTICE_IMAGE_MARKER)) return null;

    const path = decodeURIComponent(url.pathname.slice(NOTICE_IMAGE_MARKER.length));
    return path.startsWith(NOTICE_IMAGE_ROOT) && !path.split("/").includes("..")
      ? path
      : null;
  } catch {
    return null;
  }
}

export function normalizeLoungeNoticeImageUrl(
  rawImageUrl: string | null | undefined,
  businessId: string,
  expectedPublicBaseUrl?: string
): { imageUrl: string | null; error?: string } {
  const imageUrl = rawImageUrl?.trim() || null;
  if (!imageUrl) return { imageUrl: null };

  const path = extractLoungeNoticeImagePath(imageUrl, expectedPublicBaseUrl);
  if (!path || !path.startsWith(buildLoungeNoticeImagePrefix(businessId))) {
    return { imageUrl: null, error: "Invalid Lounge notice image URL" };
  }

  return { imageUrl };
}
