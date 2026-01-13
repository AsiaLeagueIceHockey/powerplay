"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { joinMatch, cancelJoin } from "@/app/actions/match";

interface JoinButtonProps {
  matchId: string;
  userId: string | null;
  userParticipant: {
    id: string;
    position: string;
    status: string;
  } | null;
  maxSkaters: number;
  maxGoalies: number;
  currentFW: number;
  currentDF: number;
  currentG: number;
  onboardingCompleted?: boolean;
}

export function JoinButton({
  matchId,
  userId,
  userParticipant,
  maxSkaters,
  maxGoalies,
  currentFW,
  currentDF,
  currentG,
  onboardingCompleted = true,
}: JoinButtonProps) {
  const t = useTranslations("match");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPositionSelect, setShowPositionSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If not logged in, show login prompt
  if (!userId) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          {t("join")}을 위해 로그인이 필요합니다
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-zinc-900 px-6 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {tAuth("login")}
        </Link>
      </div>
    );
  }

  // If onboarding not completed, redirect to onboarding
  if (!onboardingCompleted) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
        <p className="mb-4 text-amber-700 dark:text-amber-300">
          경기 참가 전 프로필 설정이 필요합니다
        </p>
        <button
          onClick={() => router.push(`/${locale}/onboarding`)}
          className="inline-block rounded-lg bg-amber-600 px-6 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          프로필 설정하기
        </button>
      </div>
    );
  }


  // If already joined, show cancel option
  if (userParticipant) {
    const handleCancel = async () => {
      setIsLoading(true);
      setError(null);
      const result = await cancelJoin(matchId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
      setIsLoading(false);
    };

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400">✓</span>
          <span className="font-medium text-green-700 dark:text-green-300">
            {t("position." + userParticipant.position)}로 신청 완료
          </span>
        </div>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {isLoading ? "..." : t("cancel")}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  const handleJoin = async (position: string) => {
    setIsLoading(true);
    setError(null);
    const result = await joinMatch(matchId, position);
    if (result.error) {
      setError(result.error);
    } else {
      setShowPositionSelect(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const currentSkaters = currentFW + currentDF;
  const availableSkaters = maxSkaters - currentSkaters;
  const availableG = maxGoalies - currentG;

  if (showPositionSelect) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 font-semibold">포지션 선택</h3>
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleJoin("FW")}
            disabled={availableSkaters <= 0 || isLoading}
            className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
          >
            {t("position.FW")}
            <span className="ml-2 text-sm opacity-70">({availableSkaters}석)</span>
          </button>
          <button
            onClick={() => handleJoin("DF")}
            disabled={availableSkaters <= 0 || isLoading}
            className="flex-1 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40"
          >
            {t("position.DF")}
            <span className="ml-2 text-sm opacity-70">({availableSkaters}석)</span>
          </button>
          <button
            onClick={() => handleJoin("G")}
            disabled={availableG <= 0 || isLoading}
            className="flex-1 rounded-lg border border-purple-300 bg-purple-50 px-4 py-3 font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/40"
          >
            {t("position.G")}
            <span className="ml-2 text-sm opacity-70">({availableG}석)</span>
          </button>
        </div>
        <button
          onClick={() => setShowPositionSelect(false)}
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPositionSelect(true)}
      className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
    >
      {t("join")}
    </button>
  );
}
