import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { TamagotchiScreenState } from "@/lib/tamagotchi-types";

export async function TamagotchiBanner({
  locale,
  state,
}: {
  locale: string;
  state: TamagotchiScreenState | null;
}) {
  const t = await getTranslations("mypage.tamagotchi.banner");

  return (
    <section className="mb-6">
      <Link
        href={`/${locale}/mypage/tamagotchi`}
        className="group flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 shadow-sm transition-all duration-300 hover:border-violet-300 hover:shadow-md dark:border-violet-900/70 dark:bg-violet-950/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 text-violet-700 dark:text-violet-300">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <p className="truncate text-sm font-bold">{t("badge")}</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-12 w-12 rounded-[14px] bg-[linear-gradient(135deg,_rgba(168,85,247,0.35)_0%,_rgba(236,72,153,0.28)_100%)] shadow-inner">
              <div className="flex h-full w-full animate-bounce items-center justify-center">
                <div className="h-6 w-6 rounded-[8px] bg-violet-500/90 shadow-[0_6px_20px_rgba(139,92,246,0.28)] dark:bg-violet-300/90" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.05rem] font-bold leading-6 text-zinc-900 dark:text-white">
                {state?.actions.bothCompleted ? t("doneTitle") : t("title")}
              </p>
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                {state ? `${state.stageLabel} · ${state.status.message}` : t("description")}
              </p>
            </div>
          </div>
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-violet-600 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-violet-300">
          <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
