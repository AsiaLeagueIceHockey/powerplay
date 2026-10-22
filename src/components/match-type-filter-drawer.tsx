"use client";

import { buttonStyles, filterChipStyles, overlayStyles, iconButtonStyles } from "@/components/ui/styles";

import { useEffect, useState } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface MatchTypeFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTypes: string[];
  onSelectTypes: (types: string[]) => void;
}

const MATCH_TYPES = ["game", "training", "team_match"] as const;

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

  const [previousInput, setPreviousInput] = useState({ isOpen, selected: selectedTypes });
  if (previousInput.isOpen !== isOpen || previousInput.selected !== selectedTypes) {
    setPreviousInput({ isOpen, selected: selectedTypes });
    if (isOpen) { setIsVisible(true); setTempSelected(selectedTypes); }
  }

  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previousOverflow; };
    }
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

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

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog" aria-modal="true" aria-labelledby="match-type-filter-title"
        className={`${overlayStyles({ kind: "sheet" })} relative w-full max-w-md transform transition-transform duration-300 flex flex-col max-h-[85vh] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-pp-surface-muted rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-pp-border ">
          <h2 id="match-type-filter-title" className="text-xl font-bold text-pp-text dark:text-white">
            {locale === "ko" ? "대관 구분" : "Match Type"}
          </h2>
          <button type="button"
            onClick={onClose}
            aria-label={locale === "ko" ? "닫기" : "Close"}
            className={`${buttonStyles({ variant: "ghost", size: "compact", shape: "circle" })} -mr-2`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MATCH_TYPES.map((type) => {
            const isSelected = tempSelected.includes(type);
            return (
              <button type="button"
                aria-pressed={isSelected}
                key={type}
                onClick={() => toggleType(type)}
                className={`${filterChipStyles({ selected: isSelected, shape: "row" })} w-full flex items-center justify-between`}
              >
                <span className="font-semibold text-left whitespace-nowrap">
                  {tMatch(`types.${type}`)}
                </span>
                {isSelected && (
                  <div className={`w-6 h-6 bg-[var(--pp-accent)] rounded-full flex items-center justify-center text-white`}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pp-border flex gap-3 safe-area-bottom">
          <button type="button"
            onClick={handleReset}
            className={iconButtonStyles({ variant: "secondary", size: "large" })}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="sr-only">{locale === "ko" ? "초기화" : "Reset"}</span>
          </button>
          <button type="button"
            onClick={handleApply}
            className={`${buttonStyles({ variant: "primary", size: "large" })} flex-1`}
          >
            {locale === "ko" ? `${tempSelected.length}개 적용하기` : `Apply (${tempSelected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
