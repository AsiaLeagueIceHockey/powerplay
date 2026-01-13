"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { joinMatch, cancelJoin } from "@/app/actions/match";

interface MatchApplicationProps {
  matchId: string;
  positions: {
    FW: boolean;
    DF: boolean;
    G: boolean;
  };
  isJoined: boolean;
  currentPosition?: string;
  matchStatus: string;
  onboardingCompleted?: boolean;
}

export function MatchApplication({
  matchId,
  positions,
  isJoined,
  currentPosition,
  matchStatus,
  onboardingCompleted = true,
}: MatchApplicationProps) {
  const t = useTranslations("match");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (pos: string) => {
    setLoading(true);
    setError(null);
    const res = await joinMatch(matchId, pos);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      setShowSelect(false);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm(t("confirmCancel"))) return;
    setLoading(true);
    const res = await cancelJoin(matchId);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  // 0. If onboarding not completed => Show onboarding prompt
  if (!onboardingCompleted && !isJoined) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
        <p className="mb-4 text-amber-700 dark:text-amber-300 font-medium">
          경기 참가 전 프로필 설정이 필요합니다
        </p>
        <button
          onClick={() => router.push(`/${locale}/onboarding`)}
          className="inline-block rounded-lg bg-amber-600 px-6 py-3 font-bold text-white transition-colors hover:bg-amber-700"
        >
          프로필 설정하기
        </button>
      </div>
    );
  }

  // 1. If Match Closed/Canceled => Show nothing or status?
  // User didn't specify, but typically we disable join.
  if (matchStatus !== "open" && !isJoined) {
    return null; 
  }

  // 2. If User Joined => Green Box with Inline Cancel
  if (isJoined) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span className="font-bold text-green-700 dark:text-green-300 text-lg">
              {t(`position.${currentPosition}`)}로 신청 완료
            </span>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 dark:bg-zinc-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {loading ? "..." : "신청 취소"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // 3. Position Select Mode
  if (showSelect) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <h3 className="mb-4 font-bold text-lg">포지션 선택</h3>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleJoin("FW")}
            disabled={!positions.FW || loading}
            className="flex-1 py-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-50 disabled:grayscale transition dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
          >
            FW
          </button>
          <button
            onClick={() => handleJoin("DF")}
            disabled={!positions.DF || loading}
            className="flex-1 py-4 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 disabled:opacity-50 disabled:grayscale transition dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300"
          >
            DF
          </button>
          <button
            onClick={() => handleJoin("G")}
            disabled={!positions.G || loading}
            className="flex-1 py-4 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 disabled:opacity-50 disabled:grayscale transition dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
          >
             G
          </button>
        </div>

        <button
          onClick={() => setShowSelect(false)}
          className="w-full py-3 text-zinc-500 font-medium hover:bg-zinc-100 rounded-lg transition dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          취소
        </button>
      </div>
    );
  }

  // 4. Default: Join Button
  return (
    <button
      onClick={() => setShowSelect(true)}
      className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {t("join")}
    </button>
  );
}
