"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

interface MatchShareButtonProps {
  match: any; // Using any for simplicity with complex match objects
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
    });
    const timeStr = date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    // Rink Name
    const rinkName = locale === "ko" ? match.rink?.name_ko : match.rink?.name_en || match.rink?.name_ko;
    
    let text = "";
    let toastMsg = "";

    if (locale === "ko") {
      // Kakao Format
      text = `[Power Play] 경기 모집\n\n🏒 ${rinkName}\n📅 ${dateStr} ${timeStr}\n\n참가 신청하기:\n${window.location.href}`;
      toastMsg = "카카오톡 공유 텍스트가 복사되었습니다!";
    } else {
      // Global Format
      text = `[Power Play] Match Invitation\n\n🏒 ${rinkName}\n📅 ${dateStr} ${timeStr}\n\nJoin here:\n${window.location.href}`;
      toastMsg = "Invitation copied to clipboard!";
    }

    try {
      await navigator.clipboard.writeText(text);
      setToastMessage(toastMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-full transition"
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
