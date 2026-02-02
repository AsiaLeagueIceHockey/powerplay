"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function FeedbackBanner() {
  const t = useTranslations();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mb-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          setDismissed(true);
        }}
        className="absolute -top-2 -right-2 z-10 bg-white dark:bg-zinc-800 rounded-full p-1 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <a
        href="https://open.kakao.com/o/gsvw6tei"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#FFEB3B] hover:bg-[#FDD835] rounded-xl p-4 shadow-sm transition-colors text-[#3A1D1D]"
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#3A1D1D] text-[#FFEB3B] w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 3.1 1.76 5.86 4.46 7.54L4 22l6.54-1.54c.48.09.97.14 1.46.14 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#3A1D1D] text-sm leading-tight mb-0.5">
              {t("common.feedback.title")}
            </p>
            <p className="text-[#3A1D1D]/80 text-xs truncate">
              {t("common.feedback.description")}
            </p>
          </div>
          <svg className="w-5 h-5 text-[#3A1D1D]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    </div>
  );
}
