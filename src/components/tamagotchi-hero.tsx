"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Drumstick, Dumbbell } from "lucide-react";
import { feedTamagotchi, trainTamagotchi } from "@/app/actions/tamagotchi";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";
import type { TamagotchiScreenState } from "@/lib/tamagotchi-types";

type TamagotchiActiveImage = "idle" | "feed" | "train";

interface TamagotchiHeroProps {
  locale: string;
  initialState: TamagotchiScreenState;
}

const ACTION_CYCLE: readonly TamagotchiActiveImage[] = ["idle", "feed", "train"] as const;

interface StatBarProps {
  label: string;
  value: number;
  accent: string;
}

function StatBar({ label, value, accent }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-zinc-600 dark:text-zinc-300">{label}</p>
        <p className="text-xs font-black tabular-nums text-zinc-900 dark:text-white">{clamped}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${accent}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function TamagotchiHero({ locale, initialState }: TamagotchiHeroProps) {
  const t = useTranslations("mypage.tamagotchi.hero");
  const [state, setState] = useState<TamagotchiScreenState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<TamagotchiActiveImage>("idle");
  const [isPending, startTransition] = useTransition();

  const cycleActiveImage = () => {
    if (isPending) return;
    setActiveImage((prev) => {
      const idx = ACTION_CYCLE.indexOf(prev);
      return ACTION_CYCLE[(idx + 1) % ACTION_CYCLE.length];
    });
  };

  const runAction = (kind: "feed" | "train") => {
    setError(null);
    setActiveImage(kind);
    startTransition(async () => {
      try {
        const result = kind === "feed"
          ? await feedTamagotchi(locale)
          : await trainTamagotchi(locale);
        if (!result.success || !result.state) {
          setError(result.error ?? t("error"));
          if (result.state) {
            setState(result.state);
          }
        } else {
          setState(result.state);
        }
      } catch {
        setError(t("error"));
      } finally {
        setTimeout(() => setActiveImage("idle"), 1500);
      }
    });
  };

  const altKey: Record<TamagotchiActiveImage, string> = {
    idle: "idleAlt",
    feed: "feedingAlt",
    train: "trainingAlt",
  };

  const statusMessage = state.actions.bothCompleted ? t("bothDone") : t("statusActive");

  return (
    <section className="mb-6 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 shadow-sm transition-colors dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-900 dark:to-violet-950/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-lg font-black text-zinc-900 dark:text-white">
          {t("greeting")}
        </h2>
        <Link
          href={`/${locale}/mypage/tamagotchi`}
          aria-label={t("detailLink")}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-white/70 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-4 flex items-stretch gap-4">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-200/80 bg-white/80 dark:border-sky-900/60 dark:bg-zinc-900/70">
          <TamagotchiAvatar
            size={80}
            colors={state.pet.colors}
            action={activeImage}
            alt={t(altKey[activeImage])}
            onTap={cycleActiveImage}
            priority
          />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <StatBar label={t("energyLabel")} value={state.pet.energy} accent="bg-emerald-500" />
          <StatBar label={t("conditionLabel")} value={state.pet.condition} accent="bg-sky-500" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => runAction("feed")}
          disabled={!state.actions.canFeed || isPending}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          <Drumstick className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {state.actions.canFeed ? t("feedCta") : t("feedDone")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => runAction("train")}
          disabled={!state.actions.canTrain || isPending}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          <Dumbbell className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {state.actions.canTrain ? t("trainCta") : t("trainDone")}
          </span>
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
        {statusMessage}
      </p>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>
      ) : null}
    </section>
  );
}
