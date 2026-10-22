"use client";

import { iconButtonStyles } from "@/components/ui/styles";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Share2 } from "lucide-react";

interface ClubShareButtonProps {
  club: { name: string };
}

export function ClubShareButton({ club }: ClubShareButtonProps) {
  const locale = useLocale();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleShare = async () => {
    const title = locale === "ko" ? "[PowerPlay] 동호회 소개" : "[PowerPlay] Club Info";
    let text = "";
    let toastMsg = "";

    if (locale === "ko") {
      text = `🏒 ${club.name}\n파워플레이에서 우리 동호회를 확인해보세요!`;
      toastMsg = "공유 링크가 복사되었습니다!";
    } else {
      text = `🏒 ${club.name}\nCheck out our club on PowerPlay!`;
      toastMsg = "Link copied to clipboard!";
    }

    const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

    if (navigator.share && !isWindows) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: window.location.href,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      const fullText = `${title}\n\n${text}\n\n${window.location.href}`;
      await navigator.clipboard.writeText(fullText);
      setToastMessage(toastMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert(locale === "ko" ? "복사에 실패했습니다." : "Failed to copy.");
    }
  };

  return (
    <div className="relative">
      <button type="button"
        onClick={handleShare}
        className={`${iconButtonStyles({ variant: "primary", size: "compact", shape: "circle" })} shrink-0`}
        title={locale === "ko" ? "링크 공유하기" : "Share Link"}
        aria-label="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showToast && (
        <div className="absolute top-12 right-0 w-64 p-3 bg-zinc-800 text-white text-sm rounded-lg shadow-lg z-50 text-center animate-fade-in-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
