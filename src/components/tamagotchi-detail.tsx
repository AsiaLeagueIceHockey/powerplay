"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Drumstick, Dumbbell, Shirt } from "lucide-react";
import { feedTamagotchi, trainTamagotchi } from "@/app/actions/tamagotchi";
import type { TamagotchiScreenState } from "@/lib/tamagotchi-types";

type TamagotchiActiveImage = "idle" | "feed" | "train";

interface TamagotchiDetailProps {
  locale: string;
  initialState: TamagotchiScreenState;
  displayName: string;
}

interface StatBarProps {
  label: string;
  value: number;
  accent: string;
}

function StatBar({ label, value, accent }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</p>
        <p className="text-base font-black tabular-nums text-zinc-900 dark:text-white">{clamped}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${accent}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function TamagotchiDetail({ locale, initialState, displayName }: TamagotchiDetailProps) {
  const tHero = useTranslations("mypage.tamagotchi.hero");
  const tDetail = useTranslations("mypage.tamagotchi.detail");
  const [state, setState] = useState<TamagotchiScreenState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<TamagotchiActiveImage>("idle");
  const [isPending, startTransition] = useTransition();

  const heroName = displayName?.trim() || tHero("fallbackNickname");

  const runAction = (kind: "feed" | "train") => {
    setError(null);
    setActiveImage(kind);
    startTransition(async () => {
      try {
        const result = kind === "feed"
          ? await feedTamagotchi(locale)
          : await trainTamagotchi(locale);
        if (!result.success || !result.state) {
          setError(result.error ?? tHero("error"));
          if (result.state) {
            setState(result.state);
          }
        } else {
          setState(result.state);
        }
      } catch {
        setError(tHero("error"));
      } finally {
        setTimeout(() => setActiveImage("idle"), 1500);
      }
    });
  };

  const altKey: Record<TamagotchiActiveImage, "characterAlt" | "feedingAlt" | "trainingAlt"> = {
    idle: "characterAlt",
    feed: "feedingAlt",
    train: "trainingAlt",
  };

  const statusMessage = state.actions.bothCompleted ? tHero("bothDone") : tHero("statusActive");

  return (
    <div className="space-y-5">
      {/* Character + Name + Stats card */}
      <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 shadow-sm transition-colors dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-900 dark:to-violet-950/40">
        <h2 className="truncate text-2xl font-black text-zinc-900 dark:text-white">
          {tDetail("pageSubtitle", { name: heroName })}
        </h2>

        <div className="mt-5 flex flex-col items-center">
          <div className="flex aspect-square w-full max-w-[256px] items-center justify-center rounded-2xl border border-sky-200/80 bg-white/80 dark:border-sky-900/60 dark:bg-zinc-900/70 sm:max-w-[320px]">
            <Image
              src={`/tamagotchi/${activeImage}.png`}
              alt={tDetail(altKey[activeImage])}
              width={320}
              height={320}
              priority
              unoptimized
              style={{ imageRendering: "pixelated" }}
              className="h-[80%] w-[80%] select-none"
            />
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {tDetail("statsHeading")}
          </h3>
          <div className="flex flex-col gap-3">
            <StatBar label={tHero("energyLabel")} value={state.pet.energy} accent="bg-emerald-500" />
            <StatBar label={tHero("conditionLabel")} value={state.pet.condition} accent="bg-sky-500" />
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {tDetail("actionsHeading")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => runAction("feed")}
              disabled={!state.actions.canFeed || isPending}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
            >
              <Drumstick className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {state.actions.canFeed ? tHero("feedCta") : tHero("feedDone")}
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
                {state.actions.canTrain ? tHero("trainCta") : tHero("trainDone")}
              </span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          {statusMessage}
        </p>
        {error ? (
          <p className="mt-2 text-xs font-semibold text-rose-500">{error}</p>
        ) : null}
      </section>

      {/* Closet stub (Phase B preview) */}
      <section
        aria-disabled="true"
        className="cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-50 p-5 opacity-60 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Shirt className="h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
            <h3 className="truncate text-base font-bold text-zinc-800 dark:text-zinc-100">
              {tDetail("closetHeading")}
            </h3>
          </div>
          <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {tDetail("closetComingSoon")}
          </span>
        </div>
        <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
          {tDetail("closetDescription")}
        </p>
      </section>
    </div>
  );
}
