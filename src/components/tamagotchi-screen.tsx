"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, ChevronLeft, Drumstick, Dumbbell, Sparkles } from "lucide-react";
import { feedTamagotchi, trainTamagotchi } from "@/app/actions/tamagotchi";
import type { TamagotchiScreenState } from "@/lib/tamagotchi-types";

function StatBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</p>
        <p className="text-sm font-black text-zinc-950 dark:text-white">{value}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${accent}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FloatingPet({ complete }: { complete: boolean }) {
  return (
    <div className="relative mx-auto flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-[28px] border border-violet-200 bg-[radial-gradient(circle_at_top,_rgba(196,181,253,0.45),_rgba(237,233,254,0.9)_55%,_rgba(255,255,255,0.98)_100%)] dark:border-violet-900/70 dark:bg-[radial-gradient(circle_at_top,_rgba(91,33,182,0.35),_rgba(24,24,27,0.96)_55%,_rgba(9,9,11,1)_100%)]">
      <div className="absolute inset-x-0 bottom-10 mx-auto h-6 w-36 rounded-full bg-violet-300/30 blur-xl dark:bg-violet-600/25" />
      <div className="absolute left-8 top-8 text-violet-500/50 dark:text-violet-300/40"><Sparkles className="h-5 w-5" /></div>
      <div className="absolute right-10 top-12 text-pink-500/40 dark:text-pink-300/35"><Sparkles className="h-4 w-4" /></div>
      <div className={`relative animate-[tamagotchi-float_3.6s_ease-in-out_infinite] rounded-[22px] border border-white/60 bg-violet-500/95 p-4 shadow-[0_16px_40px_rgba(139,92,246,0.26)] dark:border-violet-200/20 dark:bg-violet-300/90 ${complete ? "ring-4 ring-emerald-300/40 dark:ring-emerald-500/30" : ""}`}>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} className={`h-3 w-3 rounded-[5px] ${index % 5 === 0 ? "bg-white/90" : "bg-violet-100/90"}`} />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes tamagotchi-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export function TamagotchiScreen({ locale, initialState }: { locale: string; initialState: TamagotchiScreenState }) {
  const t = useTranslations("mypage.tamagotchi.screen");
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = (action: "feed" | "train") => {
    setError(null);
    startTransition(async () => {
      const result = action === "feed" ? await feedTamagotchi(locale) : await trainTamagotchi(locale);
      if (!result.success || !result.state) {
        setError(result.error || t("error"));
        if (result.state) setState(result.state);
        return;
      }
      setState(result.state);
    });
  };

  return (
    <div className="min-h-screen bg-white pt-safe dark:bg-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-safe-bottom">
        <header className="sticky top-0 z-10 -mx-5 border-b border-zinc-100 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
          <div className="flex h-16 items-center justify-between">
            <button type="button" onClick={() => router.push(`/${locale}/mypage`)} className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-white dark:hover:bg-white/10">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-black text-zinc-900 dark:text-white">{t("pageTitle")}</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="py-5">
          <section className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">{t("eyebrow")}</p>
            <h2 className="text-[1.55rem] font-black leading-tight text-zinc-950 dark:text-white">{t("headline", { name: state.displayName })}</h2>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{state.status.message}</p>
          </section>

          <section className="mt-6">
            <FloatingPet complete={state.actions.bothCompleted} />
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50/90 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("todayLabel")}</p>
                <p className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">{state.stageLabel}</p>
              </div>
              <p className="mt-3 text-base font-semibold text-zinc-900 dark:text-white">{state.status.visitMode === "read_only" ? t("doneBody") : t("activeBody")}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatBar label={t("energy")} value={state.pet.energy} accent="bg-violet-500" />
                <StatBar label={t("condition")} value={state.pet.condition} accent="bg-emerald-500" />
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("mealLabel")}</p>
                  <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">{state.meal.title}</p>
                </div>
                {state.meal.special ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">{t("specialMeal")}</span> : null}
              </div>
              <button type="button" onClick={() => runAction("feed")} disabled={!state.actions.canFeed || isPending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700">
                <Drumstick className="h-4 w-4" />
                {state.actions.canFeed ? t("feedButton") : t("feedDone")}
              </button>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("trainingLabel")}</p>
              <p className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">{state.training.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{state.training.description}</p>
              <button type="button" onClick={() => runAction("train")} disabled={!state.actions.canTrain || isPending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-300">
                <Dumbbell className="h-4 w-4" />
                {state.actions.canTrain ? t("trainButton") : t("trainDone")}
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50/90 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("reactionLabel")}</p>
            <p className="mt-2 text-lg font-bold text-zinc-950 dark:text-white">{state.reaction?.title || (state.actions.bothCompleted ? t("doneTitle") : t("reactionIdleTitle"))}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{state.reaction?.body || (state.actions.bothCompleted ? t("doneReactionBody") : t("reactionIdleBody"))}</p>
            {error ? <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p> : null}
          </section>

          <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><Bell className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-zinc-950 dark:text-white">{t("reminderTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{state.reminder.hint}</p>
                {!state.reminder.pushEnabled ? (
                  <Link href={`/${locale}/mypage`} className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    {t("reminderCta")}
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
