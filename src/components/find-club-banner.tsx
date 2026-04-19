"use client";

import { Link } from "@/i18n/navigation";

export function FindClubBanner({ locale }: { locale: string }) {
  return (
    <Link
      href="/find-club"
      className="block w-full rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-4 shadow-sm transition-transform hover:scale-[1.01] dark:border-blue-900/40 dark:from-blue-950/30 dark:via-zinc-950 dark:to-cyan-950/20"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
          <span className="text-lg">🏒</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">
            {locale === "ko" ? "나에게 맞는 하키클럽 찾기" : "Find Your Hockey Club"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {locale === "ko"
              ? "4가지 질문으로 딱 맞는 클럽을 추천받아 보세요"
              : "Get personalized recommendations with short questions"}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center text-blue-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
