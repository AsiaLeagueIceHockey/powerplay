"use client";

import { buttonStyles, filterChipStyles, overlayStyles, iconButtonStyles } from "@/components/ui/styles";

import { useEffect, useState } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";

interface RegionFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  regions: string[]; // e.g. ["서울특별시 성북구", "경기도 과천시", ...]
  selectedRegions: string[];
  onSelectRegions: (regions: string[]) => void;
}

export function RegionFilterDrawer({
  isOpen,
  onClose,
  regions,
  selectedRegions,
  onSelectRegions,
}: RegionFilterDrawerProps) {
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedRegions);

  // Handle opening animation and sync state
  const [previousInput, setPreviousInput] = useState({ isOpen, selected: selectedRegions });
  if (previousInput.isOpen !== isOpen || previousInput.selected !== selectedRegions) {
    setPreviousInput({ isOpen, selected: selectedRegions });
    if (isOpen) { setIsVisible(true); setTempSelected(selectedRegions); }
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

  const toggleRegion = (region: string) => {
    setTempSelected((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleApply = () => {
    onSelectRegions(tempSelected);
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
        role="dialog" aria-modal="true" aria-labelledby="region-filter-title"
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
          <h2 id="region-filter-title" className="text-xl font-bold text-pp-text dark:text-white">
            {locale === "ko" ? "지역 선택" : "Select Region"}
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
          {regions.length === 0 && (
            <p className="text-center text-pp-muted py-8">
              {locale === "ko" ? "선택 가능한 지역이 없습니다." : "No regions available."}
            </p>
          )}

          {regions.map((region) => {
            const isSelected = tempSelected.includes(region);
            return (
              <button type="button"
                aria-pressed={isSelected}
                key={region}
                onClick={() => toggleRegion(region)}
                className={`${filterChipStyles({ selected: isSelected, shape: "row" })} w-full flex items-center justify-between`}
              >
                <span className="font-semibold text-left">{region}</span>
                {isSelected && (
                  <div className="w-6 h-6 bg-pp-accent rounded-full flex items-center justify-center text-white">
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
