"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { applyForAdmin } from "@/app/actions/auth";

export default function AdminApplyPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    const result = await applyForAdmin();
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/admin`);
      }, 1500);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">
          {locale === "ko" ? "관리자 신청 완료!" : "Admin Access Granted!"}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {locale === "ko" ? "관리자 페이지로 이동 중..." : "Redirecting to admin page..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">
        {locale === "ko" ? "🛠️ 관리자 신청" : "🛠️ Apply for Admin"}
      </h1>
      <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
        {locale === "ko"
          ? "관리자가 되면 동호회 관리, 경기 관리 등 다양한 기능을 사용할 수 있습니다."
          : "As an admin, you can create/edit matches, manage clubs, and more."}
      </p>

      {/* Feature Cards */}
      <div className="space-y-8 mb-8">

        {/* 1. Club Management */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-bold">
              {locale === "ko" ? "동호회 관리" : "Club Management"}
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
            {locale === "ko"
              ? "동호회를 생성하고 멤버들을 관리하세요. 파워 플레이를 통해 게스트를 모집해보세요!"
              : "Create clubs and manage members. Recruit guests through PowerPlay!"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-club-1.png" alt="Club Management 1" fill className="object-contain" />
            </div>
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-club-2.png" alt="Club Management 2" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* 2. Match Management */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏒</span>
            <h2 className="text-xl font-bold">
              {locale === "ko" ? "경기 관리" : "Match Management"}
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
            {locale === "ko"
              ? "대관 시작 시간과 인원을 입력하고 경기를 쉽게 생성하세요. 주최 동호회를 선택하여 일정을 관리할 수 있습니다."
              : "Create matches with start time and player/goalie limits. Organize schedules by hosting club."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-game-1.png" alt="Match Management 1" fill className="object-contain" />
            </div>
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-game-2.png" alt="Match Management 2" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* 3. Rink Management */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏟️</span>
            <h2 className="text-xl font-bold">
              {locale === "ko" ? "링크장 관리" : "Rink Management"}
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
            {locale === "ko"
              ? "링크장이 검색이 안되나요? 네이버 지도 URL만 입력하면 링크장을 등록할 수 있습니다!"
              : "Auto-fill rink address and location by simply entering the Naver Map URL. Register your rink!"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-rink-1.png" alt="Rink Management 1" fill className="object-contain" />
            </div>
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100">
              <Image src="/admin-rink-2.png" alt="Rink Management 2" fill className="object-contain" />
            </div>
          </div>
        </div>

      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading
          ? (locale === "ko" ? "처리 중..." : "Processing...")
          : (locale === "ko" ? "관리자 신청하기" : "Apply for Admin")}
      </button>
    </div>
  );
}
