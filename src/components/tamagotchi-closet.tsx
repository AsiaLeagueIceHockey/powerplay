"use client";
import { buttonStyles, segmentedItemStyles } from "@/components/ui/styles";

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

  const [previousInput, setPreviousInput] = useState({ isOpen, initialColors });
  if (previousInput.isOpen !== isOpen || previousInput.initialColors !== initialColors) {
    setPreviousInput({ isOpen, initialColors });
    if (isOpen) { setDraft(initialColors); setSelectedPart("helmet"); setError(null); }
  }

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
      className="fixed inset-0 z-50 flex flex-col bg-pp-surface "
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-pp-border px-4 py-3 ">
        <h2 className="truncate text-base font-black text-pp-text dark:text-white">
          {t("modalTitle")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label={t("cancel")}
          className={buttonStyles({ variant: "secondary", size: "compact", shape: "circle" }) + " flex flex-shrink-0 items-center justify-center pp-icon-button"}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Preview */}
        <section aria-label={t("preview")} className="flex flex-col items-center">
          <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-2xl border border-pp-info-border/80 bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-sky-950/40 dark:via-zinc-900 dark:to-violet-950/40">
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
            className="grid grid-cols-3 gap-2 rounded-xl bg-pp-surface-muted p-1 "
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
                  className={segmentedItemStyles({ selected: isActive })}
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
                <button data-ui-exception="pet-color-swatch"
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
                      ? "border-pp-info-border ring-2 ring-pp-info-border ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
                      : "border-pp-border hover:border-pp-border "
                  }`}
                  style={{ backgroundColor: entry.hex }}
                />
              );
            })}
          </div>
        </section>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-pp-cheer-text" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-3 border-t border-pp-border px-4 py-3 ">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className={buttonStyles({ variant: "outline", size: "compact" }) + " inline-flex flex-1 items-center justify-center"}
        >
          <span className="truncate">{t("cancel")}</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={buttonStyles({ variant: "primary", size: "compact" }) + " inline-flex flex-1 items-center justify-center"}
        >
          <span className="truncate">{isPending ? t("saving") : t("save")}</span>
        </button>
      </footer>
    </div>
  );
}
