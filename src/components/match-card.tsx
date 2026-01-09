"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Match } from "@/app/actions/match";

export function MatchCard({ match }: { match: Match }) {
  const t = useTranslations("match");
  const locale = useLocale();

  const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startDate = new Date(match.start_time);
  const formattedDate = dateFormatter.format(startDate);
  const formattedTime = timeFormatter.format(startDate);

  const statusColors = {
    open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    closed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const counts = match.participants_count || { fw: 0, df: 0, g: 0 };
  const remainingFW = match.max_fw - counts.fw;
  const remainingDF = match.max_df - counts.df;
  const remainingG = match.max_g - counts.g;

  return (
    <Link
      href={`/match/${match.id}`}
      className="group block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Header: Date & Status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {formattedDate} · {formattedTime}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[match.status]}`}
        >
          {t(`status.${match.status}`)}
        </span>
      </div>

      {/* Rink Name */}
      <h3 className="mb-3 text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {rinkName || "Unknown Rink"}
      </h3>

      {/* Position Availability */}
      <div className="mb-3 flex gap-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("position.FW")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              remainingFW > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {remainingFW}/{match.max_fw}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("position.DF")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              remainingDF > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {remainingDF}/{match.max_df}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("position.G")}</span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              remainingG > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            {remainingG}/{match.max_g}
          </span>
        </div>
      </div>

      {/* Fee */}
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("fee")}: ₩{match.fee.toLocaleString()}
      </div>
    </Link>
  );
}
