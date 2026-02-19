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
  rentalFee?: number;
  userPoints?: number;
  onboardingCompleted?: boolean;
  isFull?: boolean;
  goalieFree?: boolean;
  isAuthenticated?: boolean;
  rentalOptIn?: boolean;
  rentalAvailable?: boolean; // Added
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
  rentalFee = 0,
  userPoints = 0,
  onboardingCompleted = true,
  isFull = false,
  goalieFree = false,
  isAuthenticated = false,
  rentalOptIn = false,
  rentalAvailable = false, // Added
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
  const [rentalChecked, setRentalChecked] = useState(false);
  const currentRentalFee = rentalChecked ? rentalFee : 0;

  const handleJoin = async (pos: string) => {
    setLoading(true);
    setError(null);
    const res = await joinMatch(matchId, pos, { rental: rentalChecked });
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
    const res = await joinWaitlist(matchId, pos, { rental: rentalChecked });
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

  // 1. If Match Closed/Canceled => Show nothing or status?
  // User didn't specify, but typically we disable join.
  if (matchStatus !== "open" && !isJoined) {
    return null; 
  }

  // 0. If Not Authenticated => Show Login Button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push(`/${locale}/login`)}
        className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-lg font-bold hover:bg-zinc-800 transition shadow-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {locale === "ko" ? "로그인하고 참가하기" : "Login to Join"}
      </button>
    );
  }

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
            {rentalOptIn && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 font-medium">
                {t("rentalFee")}
              </span>
            )}
            {/* We don't track rental opt-in for waitlist explicitly in UI yet, but could add if needed */}
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
    const totalRequired = entryPoints + (rentalOptIn ? rentalFee : 0);
    const shortageAmount = Math.max(0, totalRequired - userPoints);
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

          {rentalOptIn && rentalAvailable && ( // Changed check
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("rentalFee")}
              </span>
              <span className="font-semibold">
                +{rentalFee.toLocaleString()}{currencyUnit}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
             <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {t("totalCost")}
            </span>
            <span className="font-bold">
              {totalRequired.toLocaleString()}{currencyUnit}
            </span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {locale === "ko" ? "현재 잔액" : "Current Balance"}
            </span>
            <span className="font-semibold text-zinc-500">
              - {userPoints.toLocaleString()}{currencyUnit}
            </span>
          </div>

          <div className="border-t border-amber-200 dark:border-amber-700 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {locale === "ko" ? "💰 부족한 금액" : "💰 Shortage"}
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                {t(`position.${currentPosition}`)}로 참가 확정
              </span>
            </div>
            {rentalOptIn && (
              <div className="ml-6">
                <span className="px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 font-medium">
                  {t("rentalFee")}
                </span>
              </div>
            )}
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
        
        {/* Rental Option & Total Cost Calculation (Waitlist) */}
        {rentalAvailable && ( // Changed check
          <div className="mb-6 space-y-4">
             <div className="p-4 rounded-xl border-2 transition-all cursor-pointer bg-white border-zinc-200 hover:border-blue-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-blue-700"
                  onClick={() => setRentalChecked(!rentalChecked)}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                    rentalChecked 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white border-zinc-300 dark:bg-zinc-700 dark:border-zinc-600"
                  }`}>
                    {rentalChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {t("rentalFee")}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        +{rentalFee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t("rentalCheckboxDesc")}
                    </p>
                  </div>
                </div>
             </div>

             {/* Total Cost Display */}
             <div className="flex justify-between items-center px-2 py-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                  {t("totalCost")} ({locale === "ko" ? "승격 시 자동결제" : "Auto-pay on promotion"})
                </span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {(entryPoints + currentRentalFee).toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                </span>
             </div>
          </div>
        )}
        
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

  // Calculate total cost for UI
  // Note: we don't know selected position here until button click, 
  // but for "Show Select" mode, we can show dynamic cost if we had position selector first.
  // Current UI flows: Click Join -> Show Position Buttons.
  // We can add Rental Checkbox insdie `showSelect` view.

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
        
        {/* Rental Option & Total Cost Calculation */}
        {rentalAvailable && ( // Changed check
          <div className="mb-6 space-y-4">
             <div className="p-4 rounded-xl border-2 transition-all cursor-pointer bg-white border-zinc-200 hover:border-blue-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-blue-700"
                  onClick={() => setRentalChecked(!rentalChecked)}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                    rentalChecked 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white border-zinc-300 dark:bg-zinc-700 dark:border-zinc-600"
                  }`}>
                    {rentalChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {t("rentalFee")}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        +{rentalFee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t("rentalCheckboxDesc")}
                    </p>
                  </div>
                </div>
             </div>

             {/* Total Cost Display */}
             <div className="flex justify-between items-center px-2 py-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                  {t("totalCost")}
                </span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(entryPoints + currentRentalFee).toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                </span>
             </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          {/* FW Button */}
          <button
            onClick={() => positions.FW ? handleJoin("FW") : handleWaitlist("FW")}
            disabled={loading}
            className={`flex-1 py-4 rounded-xl border font-bold transition flex flex-col items-center justify-center gap-1
              ${positions.FW 
                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              }`}
          >
            <span>FW</span>
            {!positions.FW && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded dark:bg-zinc-700 dark:text-zinc-300">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
          </button>

          {/* DF Button */}
          <button
            onClick={() => positions.DF ? handleJoin("DF") : handleWaitlist("DF")}
            disabled={loading}
            className={`flex-1 py-4 rounded-xl border font-bold transition flex flex-col items-center justify-center gap-1
              ${positions.DF
                ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300"
                : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              }`}
          >
            <span>DF</span>
            {!positions.DF && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded dark:bg-zinc-700 dark:text-zinc-300">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
          </button>

          {/* G Button */}
          <button
            onClick={() => positions.G ? handleJoin("G") : handleWaitlist("G")}
            disabled={loading}
            className={`flex-1 py-4 rounded-xl border font-bold transition flex flex-col items-center justify-center gap-1 relative
              ${positions.G
                ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
                : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
              }`}
          >
            <span>G</span>
            {positions.G && goalieFree && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full">
                {t("goalieFree")}
              </span>
            )}
            {!positions.G && <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded dark:bg-zinc-700 dark:text-zinc-300">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
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
