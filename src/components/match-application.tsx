"use client";
import { buttonStyles, surfaceStyles } from "@/components/ui/styles";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
  rentalAvailable?: boolean;
  matchType?: "training" | "game" | "team_match";
  isTraining?: boolean;
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
  rentalAvailable = false,
  matchType = "training",
  isTraining = false,
}: MatchApplicationProps) {
  const t = useTranslations("match");
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [showWaitlistSelect, setShowWaitlistSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rentalChecked, setRentalChecked] = useState(false);
  const currentRentalFee = rentalChecked ? rentalFee : 0;
  const isTeamMatch = matchType === "team_match";
  const hasStarted = new Date(matchStartTime) <= new Date();

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
    const confirmMessage = isTeamMatch
      ? (locale === "ko" ? "팀 매칭 신청을 취소하시겠습니까?" : "Cancel team match application?")
      : isRefundAvailable() ? t("confirmCancel") : t("confirmCancelNoRefund");

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

  // 1. If Match Canceled => Show canceled status regardless of participation
  if (matchStatus === "canceled") {
    return (
      <div className="rounded-2xl border border-pp-danger-border bg-pp-danger-soft p-6 ">
        <div className="flex items-center gap-2">
          <span className="text-pp-danger-text font-bold text-lg">🚫</span>
          <span className="font-bold text-pp-danger-text text-lg">
            {locale === "ko" ? "취소된 경기입니다" : "This match has been canceled"}
          </span>
        </div>
        {isJoined && (
          <p className="mt-2 text-sm text-pp-danger-text ">
            {locale === "ko" ? "확정 참가자에게는 전액 환불이 진행되었습니다." : "Full refund has been processed for confirmed participants."}
          </p>
        )}
      </div>
    );
  }

  if (hasStarted) {
    return (
      <div className={`${surfaceStyles({ density: "default" })} text-center`}>
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-pp-muted text-lg">
            {locale === "ko" ? "종료된 경기입니다" : "This match has ended"}
          </span>
        </div>
      </div>
    );
  }

  // 1b. If Match Closed => Show nothing if not joined
   if (matchStatus !== "open" && !isJoined) {
    return null;
  }

  // === Team Match: Simplified flow ===
  if (isTeamMatch) {
    // Already joined
    if (isJoined) {
      return (
        <div className="rounded-2xl border border-pp-info-border bg-pp-info-soft p-6 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-pp-info-text font-bold">✓</span>
              <span className="font-bold text-pp-info-text text-lg">
                {t("teamJoined")}
              </span>
            </div>
            <button type="button"
              onClick={handleCancel}
              disabled={loading}
              className={buttonStyles({ variant: "danger", size: "compact" })}
            >
              {loading ? "..." : (locale === "ko" ? "신청 취소" : "Cancel")}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
        </div>
      );
    }

    // Not authenticated
    if (!isAuthenticated) {
      return (
        <button type="button"
          onClick={() => router.push(`/${locale}/login`)}
          className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
        >
          {locale === "ko" ? "로그인하고 참가하기" : "Login to Join"}
        </button>
      );
    }

    // Full (someone already applied)
    if (isFull) {
      return (
        <div className="rounded-2xl border border-pp-info-border bg-pp-info-soft p-4 text-center ">
          <span className="font-bold text-pp-info-text ">
            {t("teamMatchFull")}
          </span>
        </div>
      );
    }

    // Available to apply
    return (
      <div>
        <button type="button"
          onClick={() => handleJoin("FW")}
          disabled={loading}
          className={buttonStyles({ variant: positions.FW ? "secondary" : "outline", size: "large" }) + " relative flex-1 flex-col"}
        >
          {loading ? "..." : t("teamJoin")}
        </button>
        {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
      </div>
    );
  }

  // === Regular match flow below ===

  // 0. If Not Authenticated => Show Login Button
  if (!isAuthenticated) {
    return (
      <button type="button"
        onClick={() => router.push(`/${locale}/login`)}
        className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
      >
        {locale === "ko" ? "로그인하고 참가하기" : "Login to Join"}
      </button>
    );
  }

  // 0. If onboarding not completed => Show onboarding prompt
  if (!onboardingCompleted && !isJoined) {
    return (
      <div className="rounded-2xl border border-pp-warning-border bg-pp-warning-soft p-6 text-center ">
        <p className="mb-4 text-pp-warning-text font-medium">
          경기 참가 전 프로필 설정이 필요합니다
        </p>
        <button type="button"
          onClick={() => router.push(`/${locale}/onboarding`)}
          className={buttonStyles({ variant: "points", size: "default" })}
        >
          프로필 설정하기
        </button>
      </div>
    );
  }

  // 2a. If User is on waitlist (waiting status) => Blue box
  if (isJoined && currentStatus === "waiting") {
    return (
      <div className="rounded-2xl border border-pp-accent bg-pp-accent-soft p-6 ">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-pp-accent-text font-bold">⏳</span>
            <span className="font-bold text-pp-accent-text text-lg">
              {t(`position.${currentPosition}`)}로 대기 중
            </span>
            {rentalOptIn && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-pp-info-soft text-pp-info-text rounded border border-pp-info-border font-medium">
                {t("rentalFee")}
              </span>
            )}
            {/* We don't track rental opt-in for waitlist explicitly in UI yet, but could add if needed */}
          </div>

          <button type="button"
            onClick={handleCancel}
            disabled={loading}
            className={buttonStyles({ variant: "danger", size: "compact" })}
          >
            {loading ? "..." : "대기 취소"}
          </button>
        </div>
        <p className="text-sm text-pp-accent-text ">
          참가자가 취소하면 순서대로 참가 기회가 주어집니다.
        </p>
        {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
      </div>
    );
  }

  // 2b. If User Joined with pending_payment => Yellow box
  if (isJoined && currentStatus === "pending_payment") {
    const totalRequired = entryPoints + (rentalOptIn ? rentalFee : 0);
    const shortageAmount = Math.max(0, totalRequired - userPoints);
    const currencyUnit = locale === "ko" ? "원" : "KRW";

    return (
      <div className="rounded-2xl border border-pp-warning-border bg-pp-warning-soft p-6 ">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-pp-warning-text font-bold">⏳</span>
            <span className="font-bold text-pp-warning-text text-lg">
              {t(`position.${currentPosition}`)} {locale === "ko" ? "입금 대기" : "Pending Payment"}
            </span>
          </div>

          <button type="button"
            onClick={handleCancel}
            disabled={loading}
            className={buttonStyles({ variant: "danger", size: "compact" })}
          >
            {loading ? "..." : (locale === "ko" ? "신청 취소" : "Cancel")}
          </button>
        </div>

        {/* 부족 금액 안내 */}
        <div className="bg-pp-surface rounded-lg p-4 mb-4 border border-pp-warning-border ">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-pp-muted ">
              {locale === "ko" ? "경기 참가비" : "Entry Fee"}
            </span>
            <span className="font-semibold">
              {entryPoints.toLocaleString()}{currencyUnit}
            </span>
          </div>

          {rentalOptIn && rentalAvailable && ( // Changed check
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-pp-muted ">
                {t("rentalFee")}
              </span>
              <span className="font-semibold">
                +{rentalFee.toLocaleString()}{currencyUnit}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-2 pt-2 border-t border-pp-border ">
             <span className="text-sm font-bold text-pp-muted ">
              {t("totalCost")}
            </span>
            <span className="font-bold">
              {totalRequired.toLocaleString()}{currencyUnit}
            </span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-pp-muted ">
              {locale === "ko" ? "현재 잔액" : "Current Balance"}
            </span>
            <span className="font-semibold text-pp-muted">
              - {userPoints.toLocaleString()}{currencyUnit}
            </span>
          </div>

          <div className="border-t border-pp-warning-border pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-pp-warning-text ">
                {locale === "ko" ? "💰 부족한 금액" : "💰 Shortage"}
              </span>
              <span className="font-bold text-lg text-pp-warning-text ">
                {shortageAmount.toLocaleString()}{currencyUnit}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-pp-warning-text mb-3">
          {locale === "ko"
            ? "충전 후 입금 확인이 되면 경기 참가가 자동으로 확정됩니다."
            : "Your match participation will be automatically confirmed after payment is verified."}
        </p>

        <button type="button"
          onClick={() => router.push(`/${locale}/mypage/points/charge`)}
          className={`${buttonStyles({ variant: "points", size: "default" })} w-full`}
        >
          {locale === "ko" ? "충전하러 가기 →" : "Go to Charge →"}
        </button>
        {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
      </div>
    );
  }

  // 2c. If User Joined with confirmed => Green Box with Inline Cancel
  if (isJoined) {
    return (
      <div className="rounded-2xl border border-pp-success-border bg-pp-success-soft p-6 ">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-pp-success-text font-bold">✓</span>
              <span className="font-bold text-pp-success-text text-lg">
                {isTraining
                  ? (locale === "ko" ? "게스트 참가 확정" : "Confirmed as Guest")
                  : `${t(`position.${currentPosition}`)}로 참가 확정`
                }
              </span>
            </div>
            {rentalOptIn && (
              <div className="ml-6">
                <span className="px-1.5 py-0.5 text-[10px] bg-pp-info-soft text-pp-info-text rounded border border-pp-info-border font-medium">
                  {t("rentalFee")}
                </span>
              </div>
            )}
          </div>

          <button type="button"
            onClick={handleCancel}
            disabled={loading}
            className={buttonStyles({ variant: "danger", size: "compact" })}
          >
            {loading ? "..." : "신청 취소"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
      </div>
    );
  }

  // 3a. Waitlist Position Select Mode
  if (showWaitlistSelect) {
    return (
      <div className="rounded-2xl border border-pp-accent bg-pp-accent-soft p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-lg text-pp-accent-text ">대기 포지션 선택</h3>

        {error && <p className="mb-4 text-sm text-pp-danger-text">{error}</p>}

        {/* Rental Option & Total Cost Calculation (Waitlist) */}
        {rentalAvailable && ( // Changed check
          <div className="mb-6 space-y-4">
             <div className={surfaceStyles({ density: "compact" })}
                  onClick={() => setRentalChecked(!rentalChecked)}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                    rentalChecked
                      ? "bg-pp-accent border-pp-accent text-white"
                      : "bg-pp-surface border-pp-border "
                  }`}>
                    {rentalChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-pp-text ">
                        {t("rentalFee")}
                      </span>
                      <span className="font-bold text-pp-accent-text ">
                        +{rentalFee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                      </span>
                    </div>
                    <p className="text-sm text-pp-muted mt-0.5">
                      {t("rentalCheckboxDesc")}
                    </p>
                  </div>
                </div>
             </div>

             {/* Total Cost Display */}
             <div className="flex justify-between items-center px-2 py-3 bg-pp-accent-soft/50 rounded-xl border border-pp-accent ">
                <span className="text-pp-muted font-medium">
                  {t("totalCost")} ({locale === "ko" ? "승격 시 자동결제" : "Auto-pay on promotion"})
                </span>
                <span className="text-xl font-bold text-pp-accent-text ">
                  {(entryPoints + currentRentalFee).toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                </span>
             </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <button type="button"
            onClick={() => handleWaitlist("FW")}
            disabled={loading}
            className={`${buttonStyles({ variant: "primary", size: "large" })} flex-1`}
          >
            FW
          </button>
          <button type="button"
            onClick={() => handleWaitlist("DF")}
            disabled={loading}
            className={`${buttonStyles({ variant: "primary", size: "large" })} flex-1`}
          >
            DF
          </button>
          <button type="button"
            onClick={() => handleWaitlist("G")}
            disabled={loading}
            className={`${buttonStyles({ variant: "primary", size: "large" })} flex-1`}
          >
            G
          </button>
        </div>

        <button type="button"
          onClick={() => setShowWaitlistSelect(false)}
          className={`${buttonStyles({ variant: "ghost", size: "default" })} w-full`}
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
      <div className={surfaceStyles({ density: "default" })}>
        <h3 className="mb-4 font-bold text-lg">포지션 선택</h3>

        {/* Insufficient Points Warning */}
        {isInsufficientPoints && (
          <div className="mb-4 p-4 rounded-lg bg-pp-warning-soft border border-pp-warning-border ">
            <p className="text-pp-warning-text font-medium mb-2">
              💰 잔액이 부족합니다
            </p>
            <p className="text-sm text-pp-warning-text mb-3">
              이 경기에 참가하려면 충전이 필요합니다.
            </p>
            <button type="button"
              onClick={() => router.push(`/${locale}/mypage/points/charge`)}
              className={buttonStyles({ variant: "points", size: "compact" })}
            >
              충전하러 가기 →
            </button>
          </div>
        )}

        {/* Other errors */}
        {error && !isInsufficientPoints && <p className="mb-4 text-sm text-pp-danger-text">{error}</p>}

        {/* Rental Option & Total Cost Calculation */}
        {rentalAvailable && ( // Changed check
          <div className="mb-6 space-y-4">
             <div className={surfaceStyles({ density: "compact" })}
                  onClick={() => setRentalChecked(!rentalChecked)}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                    rentalChecked
                      ? "bg-pp-accent border-pp-accent text-white"
                      : "bg-pp-surface border-pp-border "
                  }`}>
                    {rentalChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-pp-text ">
                        {t("rentalFee")}
                      </span>
                      <span className="font-bold text-pp-accent-text ">
                        +{rentalFee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                      </span>
                    </div>
                    <p className="text-sm text-pp-muted mt-0.5">
                      {t("rentalCheckboxDesc")}
                    </p>
                  </div>
                </div>
             </div>

             {/* Total Cost Display */}
             <div className={`${surfaceStyles({ density: "none" })} flex justify-between items-center px-2 py-3`}>
                <span className="text-pp-muted font-medium">
                  {t("totalCost")}
                </span>
                <span className="text-xl font-bold text-pp-text ">
                  {(entryPoints + currentRentalFee).toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                </span>
             </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          {/* FW Button */}
          <button type="button"
            onClick={() => positions.FW ? handleJoin("FW") : handleWaitlist("FW")}
            disabled={loading}
            className={buttonStyles({ variant: positions.FW ? "secondary" : "outline", size: "large" }) + " relative flex-1 flex-col"}
          >
            <span>FW</span>
            {!positions.FW && <span className="text-[10px] bg-pp-surface-muted text-pp-muted px-1.5 py-0.5 rounded ">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
          </button>

          {/* DF Button */}
          <button type="button"
            onClick={() => positions.DF ? handleJoin("DF") : handleWaitlist("DF")}
            disabled={loading}
            className={buttonStyles({ variant: positions.DF ? "secondary" : "outline", size: "large" }) + " relative flex-1 flex-col"}
          >
            <span>DF</span>
            {!positions.DF && <span className="text-[10px] bg-pp-surface-muted text-pp-muted px-1.5 py-0.5 rounded ">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
          </button>

          {/* G Button */}
          <button type="button"
            onClick={() => positions.G ? handleJoin("G") : handleWaitlist("G")}
            disabled={loading}
            className={buttonStyles({ variant: positions.G ? "secondary" : "outline", size: "large" }) + " relative flex-1 flex-col"}
          >
            <span>G</span>
            {positions.G && goalieFree && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-pp-success text-white rounded-full">
                {t("goalieFree")}
              </span>
            )}
            {!positions.G && <span className="text-[10px] bg-pp-surface-muted text-pp-muted px-1.5 py-0.5 rounded ">{locale === "ko" ? "대기신청" : "Waitlist"}</span>}
          </button>
        </div>

        <button type="button"
          onClick={() => setShowSelect(false)}
          className={`${buttonStyles({ variant: "secondary", size: "default" })} w-full`}
        >
          취소
        </button>
      </div>
    );
  }

  // 4a. If match is full, show Waitlist button
  if (isFull) {
    return (
      <button type="button"
        onClick={() => setShowWaitlistSelect(true)}
        className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
      >
        {locale === "ko" ? "대기 신청" : "Join Waitlist"}
      </button>
    );
  }

  // 4b. Default: Join Button
  // Training match: show rental option if available, then join directly as FW (guest)
  if (isTraining) {
    return (
      <div className="space-y-4">
        {/* Rental Option for Training */}
        {rentalAvailable && (
          <div className={`${surfaceStyles({ density: "compact" })} space-y-4`}>
            <div className={surfaceStyles({ density: "compact" })}
                 onClick={() => setRentalChecked(!rentalChecked)}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                  rentalChecked
                    ? "bg-pp-accent border-pp-accent text-white"
                    : "bg-pp-surface border-pp-border "
                }`}>
                  {rentalChecked && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-pp-text ">
                      {t("rentalFee")}
                    </span>
                    <span className="font-bold text-pp-accent-text ">
                      +{rentalFee.toLocaleString()}{locale === "ko" ? "원" : "KRW"}
                    </span>
                  </div>
                  <p className="text-sm text-pp-muted mt-0.5">
                    {t("rentalCheckboxDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Cost Display */}
            <div className={`${surfaceStyles({ density: "none" })} flex justify-between items-center px-2 py-3`}>
              <span className="text-pp-muted font-medium">
                {t("totalCost")}
              </span>
              <span className="text-xl font-bold text-pp-text ">
                {(entryPoints + currentRentalFee).toLocaleString()}{locale === "ko" ? "원" : "KRW"}
              </span>
            </div>
          </div>
        )}

        <button type="button"
          onClick={() => handleJoin("FW")}
          disabled={loading}
          className={buttonStyles({ variant: positions.FW ? "secondary" : "outline", size: "large" }) + " relative flex-1 flex-col"}
        >
          {loading ? "..." : t("guestJoin")}
        </button>
        {error && <p className="mt-2 text-sm text-pp-danger-text">{error}</p>}
      </div>
    );
  }

  return (
    <button type="button"
      onClick={() => setShowSelect(true)}
      className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
    >
      {t("join")}
    </button>
  );
}
