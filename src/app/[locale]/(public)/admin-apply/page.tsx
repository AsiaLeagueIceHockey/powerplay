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
          ? "관리자가 되면 경기 생성/수정, 링크 관리 등 다양한 기능을 사용할 수 있습니다."
          : "As an admin, you can create/edit matches, manage rinks, and more."}
      </p>

      {/* Feature Cards */}
      <div className="space-y-6 mb-8">
        {/* Match Management */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏒</span>
            <h2 className="text-lg font-bold">
              {locale === "ko" ? "경기 관리" : "Match Management"}
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {locale === "ko" 
              ? "새 경기를 생성하고, 참가자를 관리하며, 경기 상태를 변경할 수 있습니다."
              : "Create new matches, manage participants, and update match status."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Image 
              src="/admin_screen_1.png" 
              alt="Match list" 
              width={300} 
              height={400}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
            <Image 
              src="/admin_screen_2.png" 
              alt="Create match" 
              width={300} 
              height={400}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
          </div>
        </div>

        {/* Rink Management */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏟️</span>
            <h2 className="text-lg font-bold">
              {locale === "ko" ? "링크 관리" : "Rink Management"}
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {locale === "ko" 
              ? "아이스링크 정보를 등록하고 관리합니다. 한/영 이름과 지도 URL을 설정할 수 있습니다."
              : "Register and manage ice rink information with Korean/English names and map URLs."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Image 
              src="/admin_screen_3.png" 
              alt="Rink list" 
              width={300} 
              height={400}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
            <Image 
              src="/admin_screen_4.png" 
              alt="Add rink" 
              width={300} 
              height={400}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
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
