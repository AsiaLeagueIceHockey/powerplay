"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

export function FindClubBanner() {
  const t = useTranslations("findClub");

  return (
    <Link
      href="/find-club"
      className="block w-full overflow-hidden rounded-xl bg-[#1e3a6e] px-4 py-2.5 shadow-sm transition-opacity hover:opacity-90"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white">
          <span>{t("title")}</span>
          <span aria-hidden="true">🏒</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] text-white/80">
          <span className="hidden sm:inline">{t("bannerHint")}</span>
          <ChevronRight className="h-3 w-3 text-white/80" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
