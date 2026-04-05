"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface FortuneScorePoint {
  dateKey: string;
  score: number | null;
}

interface DailyHockeyFortuneScreenProps {
  locale: string;
  displayName: string;
  shouldAnimateReveal: boolean;
  today: {
    dateKey: string;
    score: number;
    title: string;
    summary: string;
    details: string[];
  };
  recentScores: FortuneScorePoint[];
}

function formatDayLabel(dateKey: string, locale: string, isToday: boolean) {
  if (isToday) {
    return locale === "ko" ? "오늘" : "Today";
  }

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(`${dateKey}T12:00:00+09:00`));
}

function getFace(score: number) {
  if (score >= 95) {
    return "🔥";
  }

  if (score >= 90) {
    return "😎";
  }

  if (score >= 85) {
    return "🏒";
  }

  return "🥅";
}

export function DailyHockeyFortuneScreen({
  locale,
  displayName,
  shouldAnimateReveal,
  today,
  recentScores,
}: DailyHockeyFortuneScreenProps) {
  const t = useTranslations("mypage.fortune");
  const router = useRouter();
  const [revealed, setRevealed] = useState(!shouldAnimateReveal);

  useEffect(() => {
    if (!shouldAnimateReveal) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRevealed(true);
    }, 950);

    return () => window.clearTimeout(timer);
  }, [shouldAnimateReveal]);

  if (!revealed) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 pt-safe">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-safe-bottom">
          <div className="flex h-16 items-center">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/mypage`)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <p className="mt-6 text-2xl font-black text-zinc-900 dark:text-white">{t("screen.loadingTitle")}</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("screen.loadingSubtitle")}</p>
            <div className="mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/2 animate-[fortune-load_1s_ease-in-out_infinite] rounded-full bg-sky-500" />
            </div>
          </div>
          <style jsx>{`
            @keyframes fortune-load {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(200%);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-safe">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-safe-bottom">
        <header className="sticky top-0 z-10 -mx-5 border-b border-zinc-100 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/mypage`)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white">{t("screen.pageTitle")}</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="py-5">
          <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50/80 px-2.5 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid grid-cols-7 gap-1.5">
              {recentScores.map((item) => {
                const isToday = item.dateKey === today.dateKey;

                return (
                  <div
                    key={item.dateKey}
                    className={`rounded-[22px] px-2 py-2.5 text-center ${
                      isToday
                        ? "flex min-h-[96px] flex-col items-center justify-start bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                        : "flex min-h-[96px] flex-col items-center justify-start bg-transparent text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <p className="text-[11px] font-semibold">{formatDayLabel(item.dateKey, locale, isToday)}</p>
                    <p className={`mt-6 w-full text-center text-[1.2rem] font-black leading-none ${item.score === null ? "opacity-35" : ""}`}>
                      {item.score ?? "·"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{displayName}{t("screen.nameSuffix")}</p>
              <h2 className="mt-2 text-[1.5rem] font-black leading-tight text-zinc-950 dark:text-white">
                {today.title}
              </h2>
            </div>
            <div className="flex-shrink-0 pt-1 text-4xl leading-none sm:text-5xl">{getFace(today.score)}</div>
          </section>

          <section className="mt-8 rounded-[28px] bg-[linear-gradient(135deg,_rgba(239,246,255,1)_0%,_rgba(224,242,254,1)_100%)] p-5 dark:bg-[linear-gradient(135deg,_rgba(8,12,20,1)_0%,_rgba(10,22,38,1)_100%)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
              {t("screen.todayBest")}
            </p>
            <p className="mt-3 text-[2rem] font-black text-zinc-950 dark:text-white sm:text-3xl">
              {today.score}
              {t("screen.scoreSuffix")}
            </p>
            <p className="mt-3 text-base leading-7 text-zinc-700 dark:text-zinc-200">{today.summary}</p>
          </section>

          <section className="mt-8 space-y-6 pb-8">
            {today.details.map((detail, index) => (
              <div key={`${today.dateKey}-${index}`} className="text-lg leading-9 text-zinc-800 dark:text-zinc-200">
                {detail}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
