"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useLocale } from "next-intl";
import { loungeIceGoldTheme } from "./lounge-theme";

export function LoungeShareButton({ businessName }: { businessName: string }) {
  const locale = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleShare = async () => {
    const title = locale === "ko" ? `[PowerPlay] ${businessName}` : `[PowerPlay] ${businessName}`;
    const text =
      locale === "ko"
        ? `🏒 ${businessName}\n파워플레이 라운지에서 확인해보세요!`
        : `🏒 ${businessName}\nCheck it out on PowerPlay Lounge!`;
    const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

    if (navigator.share && !isWindows) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${window.location.href}`);
      setToastMessage(locale === "ko" ? "공유 링크가 복사되었습니다!" : "Link copied to clipboard!");
      window.setTimeout(() => setToastMessage(null), 2400);
    } catch (error) {
      console.error("Failed to share lounge page:", error);
      alert(locale === "ko" ? "공유에 실패했습니다." : "Failed to share.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        className={`inline-flex items-center justify-center p-1 text-zinc-500 transition-colors dark:text-zinc-300 ${loungeIceGoldTheme.shareHover}`}
        title={locale === "ko" ? "공유하기" : "Share"}
        aria-label={locale === "ko" ? "공유하기" : "Share"}
      >
        <Share2 className="h-5 w-5" />
      </button>

      {toastMessage ? (
        <div className="absolute right-0 top-12 z-20 w-56 rounded-lg bg-zinc-800 px-3 py-2 text-center text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
