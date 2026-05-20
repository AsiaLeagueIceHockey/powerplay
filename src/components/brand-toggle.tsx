"use client";

import { usePathname, useRouter } from "next/navigation";

export function BrandToggle({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // Check if current path is under youth section
  // e.g. /ko/youth, /en/youth, /ko/youth/community/post-id
  const isYouth = pathname.includes(`/${locale}/youth`) || pathname.endsWith(`/youth`);

  const handleToggle = (mode: "adult" | "youth") => {
    if (mode === "youth" && !isYouth) {
      router.push(`/${locale}/youth`);
    } else if (mode === "adult" && isYouth) {
      router.push(`/${locale}`);
    }
  };

  return (
    <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-full p-0.5 sm:p-1 w-40 sm:w-56 h-8 sm:h-10 select-none shadow-inner flex-shrink-0">
      {/* Sliding Highlight Pill */}
      <div
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out shadow-sm ${
          isYouth
            ? "left-[calc(50%+1px)] sm:left-[calc(50%+2px)] bg-gradient-to-r from-violet-600 to-indigo-600"
            : "left-0.5 sm:left-1 bg-gradient-to-r from-blue-600 to-indigo-600"
        }`}
      />

      {/* Adult Mode Button (PowerPlay) */}
      <button
        onClick={() => handleToggle("adult")}
        className={`relative z-10 flex-1 text-center text-[10px] sm:text-sm font-semibold transition-colors duration-200 ${
          !isYouth
            ? "text-white"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        {locale === "ko" ? "파워플레이" : "PowerPlay"}
      </button>

      {/* Youth Mode Button (PowerYouth) */}
      <button
        onClick={() => handleToggle("youth")}
        className={`relative z-10 flex-1 text-center text-[10px] sm:text-sm font-semibold transition-colors duration-200 ${
          isYouth
            ? "text-white"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        {locale === "ko" ? "파워유스" : "PowerYouth"}
      </button>
    </div>
  );
}
