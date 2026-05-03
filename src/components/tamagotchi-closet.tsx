"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";
import {
  TAMAGOTCHI_PALETTE,
  TAMAGOTCHI_PARTS,
  type TamagotchiPart,
} from "@/lib/tamagotchi-palette";
import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

interface TamagotchiClosetProps {
  isOpen: boolean;
  initialColors: TamagotchiPetColors;
  alt: string;
  onSave: (next: TamagotchiPetColors) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function TamagotchiCloset({
  isOpen,
  initialColors,
  alt,
  onSave,
  onClose,
}: TamagotchiClosetProps) {
  const t = useTranslations("mypage.tamagotchi.closet");
  const [selectedPart, setSelectedPart] = useState<TamagotchiPart>("helmet");
  const [draft, setDraft] = useState<TamagotchiPetColors>(initialColors);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 모달이 새로 열릴 때마다 draft 초기화 (이전 세션 잔상 차단)
  useEffect(() => {
    if (isOpen) {
      setDraft(initialColors);
      setSelectedPart("helmet");
      setError(null);
    }
  }, [isOpen, initialColors]);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isPending, onClose]);

  // 모달 열렸을 때 body 스크롤 락
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const partLabel = (part: TamagotchiPart) => t(`parts.${part}`);

  const handleSelectColor = (part: TamagotchiPart, hex: string) => {
    setDraft((prev) => ({ ...prev, [part]: hex }));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await onSave(draft);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? t("error"));
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("modalTitle")}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="truncate text-base font-black text-zinc-900 dark:text-white">
          {t("modalTitle")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label={t("cancel")}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Preview */}
        <section aria-label={t("preview")} className="flex flex-col items-center">
          <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-900 dark:to-violet-950/40">
            <TamagotchiAvatar
              size={200}
              colors={draft}
              action="idle"
              alt={alt}
              className="h-[80%] w-[80%]"
            />
          </div>
        </section>

        {/* Part tabs */}
        <section aria-label={t("modalTitle")} className="mt-6">
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900"
          >
            {TAMAGOTCHI_PARTS.map((part) => {
              const isActive = selectedPart === part;
              return (
                <button
                  key={part}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedPart(part)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="truncate">{partLabel(part)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Palette grid */}
        <section className="mt-5">
          <div className="grid grid-cols-5 gap-3">
            {TAMAGOTCHI_PALETTE[selectedPart].map((entry) => {
              const isSelected = draft[selectedPart].toUpperCase() === entry.hex.toUpperCase();
              const colorLabel = t(`colors.${entry.key}`);
              return (
                <button
                  key={entry.hex}
                  type="button"
                  onClick={() => handleSelectColor(selectedPart, entry.hex)}
                  aria-label={t("swatchAria", {
                    partLabel: partLabel(selectedPart),
                    colorLabel,
                  })}
                  aria-pressed={isSelected}
                  className={`flex aspect-square items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-sky-500 ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
                  }`}
                  style={{ backgroundColor: entry.hex }}
                />
              );
            })}
          </div>
        </section>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-rose-500" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <span className="truncate">{t("cancel")}</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          <span className="truncate">{isPending ? t("saving") : t("save")}</span>
        </button>
      </footer>
    </div>
  );
}
