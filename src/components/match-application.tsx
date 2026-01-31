"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { joinMatch, cancelJoin, joinWaitlist } from "@/app/actions/match";

interface MatchApplicationProps {
  matchId: string;
  positions: {
    FW: boolean;
    DF: boolean;
    G: boolean;
  };
  isJoined: boolean;
  currentPosition?: string;
  currentStatus?: string;
  matchStatus: string;
  matchStartTime: string;
  entryPoints?: number;
  userPoints?: number;
  onboardingCompleted?: boolean;
  isFull?: boolean;
  goalieFree?: boolean;
}

export function MatchApplication({
  matchId,
  positions,
  isJoined,
  currentPosition,
  currentStatus,
  matchStatus,
  matchStartTime,
  entryPoints = 0,
  userPoints = 0,
  onboardingCompleted = true,
  isFull = false,
  goalieFree = false,
}: MatchApplicationProps) {
  const t = useTranslations("match");
  const tParticipant = useTranslations("participant");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [showWaitlistSelect, setShowWaitlistSelect] = useState(false);
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

  const handleWaitlist = async (pos: string) => {
    setLoading(true);
    setError(null);
    const res = await joinWaitlist(matchId, pos);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
      setShowWaitlistSelect(false);
    }
    setLoading(false);
  };

  // Check if refund is available (before 23:59 the day before the match)
  const isRefundAvailable = () => {
    const matchStart = new Date(matchStartTime);
    const matchDayMidnight = new Date(matchStart);
    matchDayMidnight.setHours(0, 0, 0, 0); // 경기 당일 00:00:00
    const now = new Date();
    return now < matchDayMidnight;
  };

  const handleCancel = async () => {
    const refundable = isRefundAvailable();
    const confirmMessage = refundable 
      ? t("confirmCancel") 
      : t("confirmCancelNoRefund");
    
    if (!confirm(confirmMessage)) return;
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

  // 2a. If User is on waitlist (waiting status) => Blue box
  if (isJoined && currentStatus === "waiting") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-900/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">⏳</span>
            <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
              {t(`position.${currentPosition}`)}로 대기 중
            </span>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 dark:bg-zinc-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {loading ? "..." : "대기 취소"}
          </button>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          참가자가 취소하면 순서대로 참가 기회가 주어집니다.
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // 2b. If User Joined with pending_payment => Yellow box
  if (isJoined && currentStatus === "pending_payment") {
    const shortageAmount = Math.max(0, entryPoints - userPoints);
    const currencyUnit = locale === "ko" ? "원" : "KRW";
    
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-900/10">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold">⏳</span>
            <span className="font-bold text-amber-700 dark:text-amber-300 text-lg">
              {t(`position.${currentPosition}`)} {locale === "ko" ? "입금 대기" : "Pending Payment"}
            </span>
          </div>
          
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 dark:bg-zinc-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 whitespace-nowrap"
          >
            {loading ? "..." : (locale === "ko" ? "신청 취소" : "Cancel")}
          </button>
        </div>
        
        {/* 부족 금액 안내 */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-4 border border-amber-200 dark:border-amber-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {locale === "ko" ? "경기 참가비" : "Entry Fee"}
            </span>
            <span className="font-semibold">
              {entryPoints.toLocaleString()}{currencyUnit}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {locale === "ko" ? "현재 잔액" : "Current Balance"}
            </span>
            <span className="font-semibold">
              {userPoints.toLocaleString()}{currencyUnit}
            </span>
          </div>
          <div className="border-t border-amber-200 dark:border-amber-700 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {locale === "ko" ? "💰 필요 충전 금액" : "💰 Amount Needed"}
              </span>
              <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                {shortageAmount.toLocaleString()}{currencyUnit}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
          {locale === "ko" 
            ? "충전 후 입금 확인이 되면 경기 참가가 자동으로 확정됩니다." 
            : "Your match participation will be automatically confirmed after payment is verified."}
        </p>
        
        <button
          onClick={() => router.push(`/${locale}/mypage/points/charge`)}
          className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
        >
          {locale === "ko" ? "충전하러 가기 →" : "Go to Charge →"}
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // 2c. If User Joined with confirmed => Green Box with Inline Cancel
  if (isJoined) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            <span className="font-bold text-green-700 dark:text-green-300 text-lg">
              {t(`position.${currentPosition}`)}로 참가 확정
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

  // 3a. Waitlist Position Select Mode
  if (showWaitlistSelect) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20 shadow-sm">
        <h3 className="mb-4 font-bold text-lg text-blue-800 dark:text-blue-200">대기 포지션 선택</h3>
        
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleWaitlist("FW")}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border border-blue-300 bg-white text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-50 transition dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
          >
            FW
          </button>
          <button
            onClick={() => handleWaitlist("DF")}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border border-blue-300 bg-white text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-50 transition dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
          >
            DF
          </button>
          <button
            onClick={() => handleWaitlist("G")}
            disabled={loading}
            className="flex-1 py-4 rounded-xl border border-blue-300 bg-white text-blue-700 font-bold hover:bg-blue-100 disabled:opacity-50 transition dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
          >
            G
          </button>
        </div>

        <button
          onClick={() => setShowWaitlistSelect(false)}
          className="w-full py-3 text-zinc-500 font-medium hover:bg-blue-100 rounded-lg transition dark:text-zinc-400 dark:hover:bg-blue-800/30"
        >
          취소
        </button>
      </div>
    );
  }

  // 3b. Position Select Mode (Regular Join)
  if (showSelect) {
    // Check if the error is about insufficient points
    const isInsufficientPoints = error?.includes("Insufficient") || error?.includes("INSUFFICIENT");

    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <h3 className="mb-4 font-bold text-lg">포지션 선택</h3>
        
        {/* Insufficient Points Warning */}
        {isInsufficientPoints && (
          <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">
              💰 잔액이 부족합니다
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
              이 경기에 참가하려면 충전이 필요합니다.
            </p>
            <button
              onClick={() => router.push(`/${locale}/mypage/points/charge`)}
              className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition"
            >
              충전하러 가기 →
            </button>
          </div>
        )}
        
        {/* Other errors */}
        {error && !isInsufficientPoints && <p className="mb-4 text-sm text-red-500">{error}</p>}
        
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
            className="flex-1 py-4 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 disabled:opacity-50 disabled:grayscale transition dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 relative"
          >
            G
            {goalieFree && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
                {t("goalieFree")}
              </span>
            )}
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

  // 4a. If match is full, show Waitlist button
  if (isFull) {
    return (
      <button
        onClick={() => setShowWaitlistSelect(true)}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition shadow-sm"
      >
        {locale === "ko" ? "대기 신청" : "Join Waitlist"}
      </button>
    );
  }

  // 4b. Default: Join Button
  return (
    <button
      onClick={() => setShowSelect(true)}
      className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {t("join")}
    </button>
  );
}
