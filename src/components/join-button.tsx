"use client";
import { buttonStyles, surfaceStyles } from "@/components/ui/styles";

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
      <div className={`${surfaceStyles({ density: "default" })} text-center`}>
        <p className="mb-4 text-pp-muted ">
          {t("join")}을 위해 로그인이 필요합니다
        </p>
        <Link
          href="/login"
          className={buttonStyles({ variant: "primary", size: "compact" })}
        >
          {tAuth("login")}
        </Link>
      </div>
    );
  }

  // If onboarding not completed, redirect to onboarding
  if (!onboardingCompleted) {
    return (
      <div className="rounded-lg border border-pp-warning-border bg-pp-warning-soft p-6 text-center ">
        <p className="mb-4 text-pp-warning-text ">
          경기 참가 전 프로필 설정이 필요합니다
        </p>
        <button type="button"
          onClick={() => router.push(`/${locale}/onboarding`)}
          className={buttonStyles({ variant: "warning", size: "compact" })}
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
      <div className="rounded-lg border border-pp-success-border bg-pp-success-soft p-6 ">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-pp-success-text ">✓</span>
          <span className="font-medium text-pp-success-text ">
            {t("position." + userParticipant.position)}로 신청 완료
          </span>
        </div>
        <button type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className={buttonStyles({ variant: "danger", size: "compact" })}
        >
          {isLoading ? "..." : t("cancel")}
        </button>
        {error && (
          <p className="mt-2 text-sm text-pp-danger-text ">{error}</p>
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
    // Check if the error is about insufficient points
    const isInsufficientPoints = error?.includes("Insufficient") || error?.includes("INSUFFICIENT");

    return (
      <div className={surfaceStyles({ density: "default" })}>
        <h3 className="mb-4 font-semibold">포지션 선택</h3>
        
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
              className={buttonStyles({ variant: "warning", size: "compact" })}
            >
              충전하러 가기 →
            </button>
          </div>
        )}
        
        {/* Other errors */}
        {error && !isInsufficientPoints && (
          <p className="mb-4 text-sm text-pp-danger-text ">{error}</p>
        )}
        
        <div className="flex flex-wrap gap-3">
          <button type="button"
            onClick={() => handleJoin("FW")}
            disabled={availableSkaters <= 0 || isLoading}
            className={`${buttonStyles({ variant: "primary", size: "default" })} flex-1`}
          >
            {t("position.FW")}
            <span className="ml-2 text-sm opacity-70">({availableSkaters}석)</span>
          </button>
          <button type="button"
            onClick={() => handleJoin("DF")}
            disabled={availableSkaters <= 0 || isLoading}
            className={`${buttonStyles({ variant: "outline", size: "default" })} flex-1`}
          >
            {t("position.DF")}
            <span className="ml-2 text-sm opacity-70">({availableSkaters}석)</span>
          </button>
          <button type="button"
            onClick={() => handleJoin("G")}
            disabled={availableG <= 0 || isLoading}
            className={`${buttonStyles({ variant: "outline", size: "default" })} flex-1`}
          >
            {t("position.G")}
            <span className="ml-2 text-sm opacity-70">({availableG}석)</span>
          </button>
        </div>
        <button type="button"
          onClick={() => setShowPositionSelect(false)}
          className={`${buttonStyles({ variant: "ghost", size: "compact" })} mt-4`}
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button type="button"
      onClick={() => setShowPositionSelect(true)}
      className={`${buttonStyles({ variant: "primary", size: "large" })} w-full`}
    >
      {t("join")}
    </button>
  );
}
