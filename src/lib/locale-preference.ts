export const LOCALE_PREFERENCE_KEY = "powerplay-locale-preference";
export const LOCALE_PREFERENCE_COOKIE = "powerplay-locale-preference";

type SupportedLocale = "ko" | "en";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getStoredLocalePreference(): SupportedLocale | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_PREFERENCE_KEY);
    return stored === "ko" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredLocalePreference(locale: SupportedLocale) {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_PREFERENCE_KEY, locale);
  } catch {
    // Ignore storage failures and keep navigation working.
  }

  document.cookie = `${LOCALE_PREFERENCE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function browserPrefersEnglish() {
  if (!hasWindow()) {
    return false;
  }

  const primaryLanguage = window.navigator.languages?.[0] || window.navigator.language || "";
  return primaryLanguage.toLowerCase().startsWith("en");
}
