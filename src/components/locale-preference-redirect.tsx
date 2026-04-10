"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { browserPrefersEnglish, getStoredLocalePreference } from "@/lib/locale-preference";

export function LocalePreferenceRedirect({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (locale !== "ko") {
      return;
    }

    if (!pathname.startsWith("/ko")) {
      return;
    }

    const storedPreference = getStoredLocalePreference();
    if (storedPreference === "ko") {
      return;
    }

    const shouldUseEnglish =
      storedPreference === "en" || (storedPreference === null && browserPrefersEnglish());

    if (!shouldUseEnglish) {
      return;
    }

    const nextPath = pathname.replace(/^\/ko(?=\/|$)/, "/en");
    const query = window.location.search;
    const nextUrl = query ? `${nextPath}${query}` : nextPath;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }, [locale, pathname, router]);

  return null;
}
