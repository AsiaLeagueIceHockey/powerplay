"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/styles";

export function FindClubBanner() {
  const t = useTranslations("findClub");

  return (
    <Link
      href="/find-club"
      // The single primary action of the clubs home (P7); same compact height on every home tab.
      className={`${buttonStyles({ variant: "primary", size: "default", fullWidth: true })} justify-between`}
    >
      <h2 className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold">
        <span className="truncate">{t("title")}</span>
        <span aria-hidden="true">🏒</span>
      </h2>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium opacity-80">
        <span className="hidden sm:inline">{t("bannerHint")}</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
