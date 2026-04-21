"use client";

import { Link } from "@/i18n/navigation";

export function FindClubBanner({ locale }: { locale: string }) {
  return (
    <Link
      href="/find-club"
      className="block w-full overflow-hidden rounded-xl bg-[#1e3a6e] px-4 py-2.5 shadow-sm transition-opacity hover:opacity-90"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          {locale === "ko" ? "나에게 맞는 하키클럽 찾기" : "Find Your Hockey Club"}
          <span>🏒</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-white/80">
          <span>{locale === "ko" ? "3가지 질문으로 추천받기" : "3 questions"}</span>
          <svg className="h-3 w-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
