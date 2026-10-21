"use client";
import { buttonStyles } from "@/components/ui/styles";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Drumstick, Dumbbell, Shirt } from "lucide-react";
import { feedTamagotchi, trainTamagotchi, updateTamagotchiColors } from "@/app/actions/tamagotchi";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";
import { TamagotchiCloset } from "@/components/tamagotchi-closet";
import type { TamagotchiPetColors, TamagotchiScreenState } from "@/lib/tamagotchi-types";

type TamagotchiActiveImage = "idle" | "feed" | "train";

interface TamagotchiDetailProps {
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-pp-muted ">{label}</p>
        <p className="text-base font-black tabular-nums text-pp-text dark:text-white">{clamped}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-pp-surface-muted/80 ">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${accent}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function TamagotchiDetail({ locale, initialState }: TamagotchiDetailProps) {
  const tHero = useTranslations("mypage.tamagotchi.hero");
  const tDetail = useTranslations("mypage.tamagotchi.detail");
  const tCloset = useTranslations("mypage.tamagotchi.closet");
  const [state, setState] = useState<TamagotchiScreenState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<TamagotchiActiveImage>("idle");
  const [isPending, startTransition] = useTransition();
  const [isClosetOpen, setIsClosetOpen] = useState(false);

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

  const handleSaveColors = async (next: TamagotchiPetColors) => {
    const result = await updateTamagotchiColors(locale, next);
    if (result.success && result.state) {
      setState(result.state);
      return { success: true };
    }
    return { success: false, error: result.error ?? tCloset("error") };
  };

  return (
    <div className="space-y-5">
      {/* Character + Stats card */}
      <section className="rounded-2xl border border-pp-info-border bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5 shadow-sm transition-colors dark:from-sky-950/40 dark:via-zinc-900 dark:to-violet-950/40">
        <div className="flex flex-col items-center">
          <div className="flex aspect-square w-full max-w-[256px] items-center justify-center rounded-2xl border border-pp-info-border/80 bg-white/80 dark:bg-pp-surface/70 sm:max-w-[320px]">
            <TamagotchiAvatar
              size={216}
              colors={state.pet.colors}
              action={activeImage}
              alt={tDetail(altKey[activeImage])}
              onTap={cycleActiveImage}
              priority
            />
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-bold text-pp-muted ">
            {tDetail("statsHeading")}
          </h3>
          <div className="flex flex-col gap-3">
            <StatBar label={tHero("energyLabel")} value={state.pet.energy} accent="bg-emerald-500" />
            <StatBar label={tHero("conditionLabel")} value={state.pet.condition} accent="bg-sky-500" />
          </div>
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-bold text-pp-muted ">
            {tDetail("actionsHeading")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => runAction("feed")}
              disabled={!state.actions.canFeed || isPending}
              className={buttonStyles({ variant: "success", size: "compact" }) + " inline-flex items-center justify-center gap-1.5"}
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
              className={buttonStyles({ variant: "primary", size: "compact" }) + " inline-flex items-center justify-center gap-1.5"}
            >
              <Dumbbell className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {state.actions.canTrain ? tHero("trainCta") : tHero("trainDone")}
              </span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-pp-muted ">
          {statusMessage}
        </p>
        {error ? (
          <p className="mt-2 text-xs font-semibold text-pp-cheer-text">{error}</p>
        ) : null}
      </section>

      {/* Closet entry card */}
      <button
        type="button"
        onClick={() => setIsClosetOpen(true)}
        className={buttonStyles({ variant: "outline", size: "compact" }) + " group block w-full text-left"}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-pp-info-soft ">
            <Shirt className="h-5 w-5 text-pp-info-text " />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-pp-text ">
              {tDetail("closetHeading")}
            </h3>
            <p className="mt-0.5 truncate text-sm text-pp-muted ">
              {tDetail("closetDescription")}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {(["helmet", "jersey", "skate"] as const).map((part) => (
              <span
                key={part}
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-pp-border "
                style={{ backgroundColor: state.pet.colors[part] }}
              />
            ))}
            <ChevronRight className="ml-1 h-5 w-5 flex-shrink-0 text-pp-muted transition-colors group-hover:text-pp-accent-text " />
          </div>
        </div>
      </button>

      <TamagotchiCloset
        isOpen={isClosetOpen}
        initialColors={state.pet.colors}
        alt={tDetail(altKey.idle)}
        onSave={handleSaveColors}
        onClose={() => setIsClosetOpen(false)}
      />
    </div>
  );
}
