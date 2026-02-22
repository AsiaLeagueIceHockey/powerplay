"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    router.push(newPath);
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          {locale === "ko" ? "언어 설정" : "Language Settings"}
        </h2>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
        <button
          onClick={() => switchLocale("ko")}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition border ${
            locale === "ko"
              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          🇰🇷 한국어
        </button>
        <button
          onClick={() => switchLocale("en")}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition border ${
            locale === "en"
              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          🇺🇸 English
        </button>
      </div>
      </div>
    </div>
  );
}
