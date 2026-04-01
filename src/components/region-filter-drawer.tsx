"use client";

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
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTempSelected(selectedRegions);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedRegions]);

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
            {locale === "ko" ? "지역 선택" : "Select Region"}
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
          {regions.length === 0 && (
            <p className="text-center text-zinc-500 py-8">
              {locale === "ko" ? "선택 가능한 지역이 없습니다." : "No regions available."}
            </p>
          )}

          {regions.map((region) => {
            const isSelected = tempSelected.includes(region);
            return (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="font-semibold text-left">{region}</span>
                {isSelected && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
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
