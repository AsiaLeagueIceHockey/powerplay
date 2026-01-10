"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export function FeedbackBanner() {
  const locale = useLocale();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mb-6 shadow-lg">
      {/* Close Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <a
        href="https://forms.gle/WB8AUGXqFooHqLBn8"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3"
      >
        <span className="text-2xl">💬</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">
            {locale === "ko" ? "여러분의 의견을 들려주세요!" : "We'd love your feedback!"}
          </p>
          <p className="text-white/80 text-xs">
            {locale === "ko" 
              ? "파워플레이를 더 좋게 만들 아이디어가 있으신가요?" 
              : "Have ideas to make Power Play better?"}
          </p>
        </div>
        <span className="text-white text-sm font-medium px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition">
          {locale === "ko" ? "의견 보내기 →" : "Share →"}
        </span>
      </a>
    </div>
  );
}
