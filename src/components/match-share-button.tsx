"use client";

import { iconButtonStyles } from "@/components/ui/styles";

import type { Match } from "@/app/actions/match";
import { useState } from "react";
import { useLocale } from "next-intl";

interface MatchShareButtonProps {
  match: Pick<Match, "rink" | "start_time">;
}

export function MatchShareButton({ match }: MatchShareButtonProps) {
  const locale = useLocale();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleShare = async () => {
    // Generate Text
    const date = new Date(match.start_time);
    const dateStr = date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    });
    const timeStr = date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });

    // Rink Name
    const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en || match.rink?.name_ko;

    const title = locale === "ko" ? "[PowerPlay] 경기 모집" : "[PowerPlay] Match Invitation";
    let text = "";
    let toastMsg = "";

    if (locale === "ko") {
      text = `🏒 ${rinkName}\n📅 ${dateStr} ${timeStr}`;
      toastMsg = "카카오톡 공유 텍스트가 복사되었습니다!";
    } else {
      text = `🏒 ${rinkName}\n📅 ${dateStr} ${timeStr}`;
      toastMsg = "Invitation copied to clipboard!";
    }

    // Platform check (Windows share is often buggy/unwanted)
    const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

    // Use Web Share API if available (mobile, excluding Windows)
    if (navigator.share && !isWindows) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: window.location.href,
        });
        return; // Success, no toast needed
      } catch (err: unknown) {
        // User cancelled or error - fall through to clipboard
        if (err instanceof Error && err.name === 'AbortError') {
          return; // User cancelled, do nothing
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      const fullText = `${title}\n\n${text}\n\n참가 신청하기:\n${window.location.href}`;
      await navigator.clipboard.writeText(fullText);
      setToastMessage(locale === "ko" ? "클립보드에 복사되었습니다." : "Copied to clipboard!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for insecure context if needed
      alert(locale === "ko" ? "복사에 실패했습니다." : "Failed to copy.");
    }
  };

  return (
    <div className="relative">
      <button type="button"
        onClick={handleShare}
        className={iconButtonStyles({ variant: "primary", size: "compact", shape: "circle" })}
        title={locale === "ko" ? "공유하기" : "Share"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
      </button>

      {showToast && (
        <div className="absolute top-10 right-0 w-64 p-3 bg-zinc-800 text-white text-sm rounded-lg shadow-lg z-50 text-center animate-fade-in-up">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
