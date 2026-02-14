"use client";

import { Club } from "@/app/actions/types";
import { joinClub } from "@/app/actions/clubs";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface JoinClubButtonProps {
  club: Club;
  initialStatus: "approved" | "pending" | "rejected" | null;
}

export function JoinClubButton({ club, initialStatus, className }: JoinClubButtonProps & { className?: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [showIntroForm, setShowIntroForm] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const locale = useLocale();
  const router = useRouter();

  const handleJoin = async () => {
    setLoading(true);
    const res = await joinClub(club.id, introMessage.trim() || undefined);
    
    if (res.error) {
      if (res.error === "Not authenticated") {
        alert(locale === "ko" ? "로그인이 필요합니다." : "Please login first.");
      } else if (res.error === "already_pending") {
        alert(locale === "ko" ? "이미 가입 신청 중입니다." : "Application already pending.");
      } else if (res.error === "already_member") {
        alert(locale === "ko" ? "이미 가입된 동호회입니다." : "Already a member.");
      } else {
        alert(locale === "ko" ? "가입 실패: " + res.error : "Failed to join: " + res.error);
      }
    } else {
      setStatus("pending");
      setShowIntroForm(false);
      alert(locale === "ko" 
        ? "가입 신청이 완료되었습니다! 관리자 승인을 기다려주세요." 
        : "Application submitted! Please wait for admin approval.");
      router.refresh();
    }
    setLoading(false);
  };

  if (status === "approved") {
    return (
      <span className={`px-6 py-2 rounded-lg font-medium bg-zinc-100 text-zinc-400 cursor-default inline-block ${className || ""}`}>
        {locale === "ko" ? "✅ 가입됨" : "✅ Joined"}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className={`px-6 py-2 rounded-lg font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 cursor-default inline-block ${className || ""}`}>
        {locale === "ko" ? "⏳ 승인 대기 중" : "⏳ Pending Approval"}
      </span>
    );
  }

  // Show intro form for applying
  if (showIntroForm) {
    return (
      <div className={`bg-zinc-800 rounded-lg p-4 border border-zinc-700 space-y-3 ${className || ""}`}>
        <label className="block text-sm font-medium text-zinc-300">
          {locale === "ko" ? "자기소개 (선택)" : "Introduction (Optional)"}
        </label>
        <textarea
          value={introMessage}
          onChange={(e) => setIntroMessage(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={locale === "ko" 
            ? "동호회 관리자에게 전달할 자기소개를 작성해주세요..." 
            : "Write a brief introduction for the club manager..."}
          rows={3}
          maxLength={500}
        />
        <div className="flex gap-2">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {loading 
              ? "..." 
              : (locale === "ko" ? "가입 신청" : "Apply")}
          </button>
          <button
            onClick={() => setShowIntroForm(false)}
            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors text-sm"
          >
            {locale === "ko" ? "취소" : "Cancel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setShowIntroForm(true);
      }}
      className={`px-6 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-sm ${className || ""}`}
    >
      {status === "rejected" 
        ? (locale === "ko" ? "다시 신청하기" : "Re-apply")
        : (locale === "ko" ? "동호회 가입하기" : "Join Club")}
    </button>
  );
}
