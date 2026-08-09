export type SupportedAuthLocale = "ko" | "en";

const LOUNGE_RETURN_PATH = /^\/(ko|en)\/lounge\/([a-z0-9가-힣_]+(?:-[a-z0-9가-힣_]+)*)$/;

function normalizeLocale(locale: string): SupportedAuthLocale {
  return locale === "en" ? "en" : "ko";
}

/**
 * Validates an already-decoded value from Next search params or URLSearchParams.
 * Do not decode the input again: residual percent escapes are deliberately unsafe.
 */
export function sanitizeAuthReturnPath(
  value: string | null | undefined,
  currentLocale: string
): string {
  const fallback = `/${normalizeLocale(currentLocale)}`;

  if (!value || value.includes("%")) {
    return fallback;
  }

  if (
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  return LOUNGE_RETURN_PATH.test(value) ? value : fallback;
}

export function buildOAuthCallbackUrl(
  origin: string,
  next: string | null | undefined,
  locale: string
): string {
  const safeNext = sanitizeAuthReturnPath(next, locale);
  const callbackLocale = normalizeLocale(locale);
  const callbackUrl = new URL(`/${callbackLocale}/auth/callback`, origin);
  callbackUrl.searchParams.set("next", safeNext);
  return callbackUrl.toString();
}
