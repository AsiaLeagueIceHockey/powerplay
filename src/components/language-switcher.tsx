"use client";
import { segmentedItemStyles, surfaceStyles } from "@/components/ui/styles";

import { usePathname, useRouter } from "next/navigation";
import { setStoredLocalePreference } from "@/lib/locale-preference";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    if (newLocale === "ko" || newLocale === "en") {
      setStoredLocalePreference(newLocale);
    }

    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
  };

  return (
    <div className={surfaceStyles({ density: "compact" })}>
      <div className="flex gap-3">
          <button type="button"
            onClick={() => switchLocale("ko")}
            aria-pressed={locale === "ko"}
            className={`${segmentedItemStyles({ selected: locale === "ko" })} flex-1`}
          >
            🇰🇷 한국어
          </button>
          <button type="button"
            onClick={() => switchLocale("en")}
            aria-pressed={locale === "en"}
            className={`${segmentedItemStyles({ selected: locale === "en" })} flex-1`}
          >
            🇺🇸 English
          </button>
        </div>
    </div>
  );
}
