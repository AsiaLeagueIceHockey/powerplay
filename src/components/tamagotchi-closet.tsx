"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { TamagotchiAvatar } from "@/components/tamagotchi-avatar";
import {
  TAMAGOTCHI_PALETTE,
  TAMAGOTCHI_PARTS,
  type TamagotchiPart,
} from "@/lib/tamagotchi-palette";
import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

interface ClosetClub {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface TamagotchiClosetProps {
  isOpen: boolean;
  initialColors: TamagotchiPetColors;
  alt: string;
  onSave: (next: TamagotchiPetColors) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  // v56 — 클럽 유니폼
  locale: string;
  initialUniformClubId: string | null;
  myClubs: ClosetClub[];
  onSaveUniform: (
    clubId: string | null
  ) => Promise<{ success: boolean; error?: string }>;
}

type StyleMode = "default" | "uniform";

export function TamagotchiCloset({
  isOpen,
  initialColors,
  alt,
  onSave,
  onClose,
  locale,
  initialUniformClubId,
  myClubs,
  onSaveUniform,
}: TamagotchiClosetProps) {
  const t = useTranslations("mypage.tamagotchi.closet");
  const [selectedPart, setSelectedPart] = useState<TamagotchiPart>("helmet");
  const [draft, setDraft] = useState<TamagotchiPetColors>(initialColors);
  const [styleMode, setStyleMode] = useState<StyleMode>(
    initialUniformClubId ? "uniform" : "default"
  );
  const [draftClubId, setDraftClubId] = useState<string | null>(
    initialUniformClubId ?? (myClubs[0]?.id ?? null)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 모달이 새로 열릴 때마다 draft 초기화 (이전 세션 잔상 차단)
  useEffect(() => {
    if (isOpen) {
      setDraft(initialColors);
      setSelectedPart("helmet");
      setStyleMode(initialUniformClubId ? "uniform" : "default");
      setDraftClubId(initialUniformClubId ?? (myClubs[0]?.id ?? null));
      setError(null);
    }
  }, [isOpen, initialColors, initialUniformClubId, myClubs]);

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

  const previewLogoUrl = useMemo(() => {
    if (styleMode !== "uniform" || !draftClubId) {
      return null;
    }
    return myClubs.find((c) => c.id === draftClubId)?.logoUrl ?? null;
  }, [styleMode, draftClubId, myClubs]);

  if (!isOpen) {
    return null;
  }

  const partLabel = (part: TamagotchiPart) => t(`parts.${part}`);
  const hasNoClubs = myClubs.length === 0;

  const handleSelectColor = (part: TamagotchiPart, hex: string) => {
    setDraft((prev) => ({ ...prev, [part]: hex }));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const colorResult = await onSave(draft);
      if (!colorResult.success) {
        setError(colorResult.error ?? t("error"));
        return;
      }

      // 유니폼 저장 — mode=default 면 NULL, uniform 이면 draftClubId
      const targetUniformClubId = styleMode === "uniform" ? draftClubId : null;
      // 변경 없으면 RPC 스킵 (불필요한 호출 방지)
      if (targetUniformClubId !== initialUniformClubId) {
        const uniformResult = await onSaveUniform(targetUniformClubId);
        if (!uniformResult.success) {
          setError(uniformResult.error ?? t("error"));
          return;
        }
      }

      onClose();
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
              clubLogoUrl={previewLogoUrl}
              className="h-[80%] w-[80%]"
            />
          </div>
        </section>

        {/* Style Mode toggle */}
        <section aria-label={t("uniform.toggleLabel")} className="mt-6">
          <p className="mb-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">
            {t("uniform.toggleLabel")}
          </p>
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={styleMode === "default"}
              onClick={() => setStyleMode("default")}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                styleMode === "default"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <span className="truncate">{t("uniform.optionDefault")}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={styleMode === "uniform"}
              onClick={() => !hasNoClubs && setStyleMode("uniform")}
              disabled={hasNoClubs}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                styleMode === "uniform"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <span className="truncate">{t("uniform.optionUniform")}</span>
            </button>
          </div>

          {hasNoClubs ? (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {t("uniform.noClubsHint")}
              </p>
              <Link
                href={`/${locale}/clubs`}
                className="mt-2 inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                <span className="truncate">{t("uniform.findClubCta")}</span>
              </Link>
            </div>
          ) : styleMode === "uniform" ? (
            <div className="mt-3">
              <label
                htmlFor="closet-uniform-club"
                className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-200"
              >
                {t("uniform.selectClubLabel")}
              </label>
              <select
                id="closet-uniform-club"
                value={draftClubId ?? ""}
                onChange={(event) => setDraftClubId(event.target.value || null)}
                disabled={isPending}
                className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                {myClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
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
