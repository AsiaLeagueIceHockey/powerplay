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
        className="group flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-pp-accent bg-pp-accent-soft px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md "
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 text-pp-accent-text ">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <p className="truncate text-sm font-bold">
              {fortune?.hasFortune ? t("banner.seenBadge") : t("banner.ctaBadge")}
            </p>
          </div>
          {fortune?.hasFortune ? (
            <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
              <p className="truncate text-[1.05rem] font-bold leading-6 text-pp-text dark:text-white">
                {fortune.title}
              </p>
              <span className="flex-shrink-0 rounded-full bg-pp-surface px-3 py-1 text-[1rem] font-black text-pp-text shadow-sm dark:text-white">
                {fortune.score}
                {t("banner.scoreSuffix")}
              </span>
            </div>
          ) : (
            <>
              <p className="mt-1 whitespace-nowrap text-[0.95rem] font-bold leading-6 text-pp-muted ">
                {t("banner.ctaDescription")}
              </p>
            </>
          )}
        </div>

        {fortune?.hasFortune ? (
          <span className="sr-only">{fortune.score}{t("banner.scoreSuffix")}</span>
        ) : (
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-pp-accent-text transition-transform duration-300 group-hover:translate-x-0.5 ">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Link>
    </section>
  );
}
