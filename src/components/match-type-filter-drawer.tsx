"use client";

import { useEffect, useState } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface MatchTypeFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTypes: string[];
  onSelectTypes: (types: string[]) => void;
}

const MATCH_TYPES = ["training", "game", "team_match"] as const;

export function MatchTypeFilterDrawer({
  isOpen,
  onClose,
  selectedTypes,
  onSelectTypes,
}: MatchTypeFilterDrawerProps) {
  const locale = useLocale();
  const tMatch = useTranslations("match");
  const [isVisible, setIsVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedTypes);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTempSelected(selectedTypes);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedTypes]);

  const toggleType = (type: string) => {
    setTempSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    onSelectTypes(tempSelected);
    onClose();
  };

  const handleReset = () => {
    setTempSelected([]);
  };

  if (!isVisible && !isOpen) return null;

  // Color configs per type
  const typeColors: Record<string, { bg: string; border: string; text: string; check: string }> = {
    training: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-500",
      text: "text-blue-700 dark:text-blue-300",
      check: "bg-blue-600",
    },
    game: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-500",
      text: "text-purple-700 dark:text-purple-300",
      check: "bg-purple-600",
    },
    team_match: {
      bg: "bg-teal-50 dark:bg-teal-900/20",
      border: "border-teal-500",
      text: "text-teal-700 dark:text-teal-300",
      check: "bg-teal-600",
    },
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl transform transition-transform duration-300 flex flex-col max-h-[85vh] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {locale === "ko" ? "대관 구분" : "Match Type"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MATCH_TYPES.map((type) => {
            const isSelected = tempSelected.includes(type);
            const colors = typeColors[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="font-semibold text-left whitespace-nowrap">
                  {tMatch(`types.${type}`)}
                </span>
                {isSelected && (
                  <div className={`w-6 h-6 ${colors.check} rounded-full flex items-center justify-center text-white`}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 safe-area-bottom">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 transition"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="sr-only">Reset</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            {locale === "ko" ? `${tempSelected.length}개 적용하기` : `Apply (${tempSelected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
