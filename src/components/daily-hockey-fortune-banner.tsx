import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface DailyHockeyFortuneBannerProps {
  locale: string;
  fortune: {
    hasFortune: boolean;
    score: number | null;
    title: string | null;
  } | null;
}

export async function DailyHockeyFortuneBanner({
  locale,
  fortune,
}: DailyHockeyFortuneBannerProps) {
  const t = await getTranslations("mypage.fortune");

  return (
    <section className="mb-6">
      <Link
        href={`/${locale}/mypage/fortune`}
        className="group flex items-center justify-between gap-4 overflow-hidden rounded-[22px] border border-blue-200 bg-blue-50 px-5 py-4 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-blue-900/70 dark:bg-blue-950/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <p className="truncate text-sm font-bold">
              {fortune?.hasFortune ? t("banner.seenBadge") : t("banner.ctaBadge")}
            </p>
          </div>
          {fortune?.hasFortune ? (
            <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
              <p className="truncate text-[1.05rem] font-bold leading-6 text-zinc-900 dark:text-white">
                {fortune.title}
              </p>
              <span className="flex-shrink-0 rounded-full bg-white px-3 py-1 text-[1rem] font-black text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white">
                {fortune.score}
                {t("banner.scoreSuffix")}
              </span>
            </div>
          ) : (
            <>
              <p className="mt-1 whitespace-nowrap text-[0.95rem] font-bold leading-6 text-zinc-600 dark:text-zinc-300">
                {t("banner.ctaDescription")}
              </p>
            </>
          )}
        </div>

        {fortune?.hasFortune ? (
          <span className="sr-only">{fortune.score}{t("banner.scoreSuffix")}</span>
        ) : (
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-blue-600 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-blue-300">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Link>
    </section>
  );
}
