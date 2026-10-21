"use client";

import { buttonStyles } from "@/components/ui/styles";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { UserPlus, UserMinus } from "lucide-react";

import { subscribeToClubNews, unsubscribeFromClubNews } from "@/app/actions/clubs";
import {
  clubDetailActionIconClass,
  clubDetailActionLabelClass,
} from "@/components/club-detail-action-styles";

interface ClubSubscribeButtonProps {
  clubId: string;
  isLoggedIn: boolean;
  isSubscribed: boolean;
  className?: string;
}

export function ClubSubscribeButton({
  clubId,
  isLoggedIn,
  isSubscribed,
  className = "",
}: ClubSubscribeButtonProps) {
  const locale = useLocale();
  const t = useTranslations("club.subscription");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);

  const handleToggle = async () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }

    if (subscribed) {
      const confirmLeave = window.confirm(
        locale === "ko"
          ? "정말 소속팀에서 나가시겠습니까?"
          : "Are you sure you want to leave this team?"
      );
      if (!confirmLeave) return;

      setIsSubmitting(true);
      const result = await unsubscribeFromClubNews(clubId);
      setIsSubmitting(false);

      if (!result.success) {
        alert(
          result.error ||
          (locale === "ko"
            ? "팀에서 나가는 중 문제가 발생했어요."
            : "Something went wrong while leaving.")
        );
        return;
      }

      setSubscribed(false);
      router.refresh();
      return;
    }

    setIsSubmitting(true);
    const result = await subscribeToClubNews(clubId);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.error === "Not authenticated") {
        router.push(`/${locale}/login`);
        return;
      }

      alert(
        locale === "ko"
          ? "소속팀 등록 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요."
          : "Something went wrong while registering. Please try again."
      );
      return;
    }

    setSubscribed(true);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isSubmitting}
      className={`${buttonStyles({ variant: subscribed ? "danger" : "outline", size: "club" })} ${className}`}
    >
      {isSubmitting ? (
        <span className="w-5 h-5 block opacity-50" />
      ) : subscribed ? (
        <UserMinus strokeWidth={2.25} className={`${clubDetailActionIconClass}`} />
      ) : (
        <UserPlus
          strokeWidth={2.25}
          className={`${clubDetailActionIconClass} text-pp-text dark:text-white`}
        />
      )}
      <span className={clubDetailActionLabelClass}>
        {isSubmitting
          ? "..."
          : subscribed
          ? (locale === "ko" ? "팀에서 나가기" : "Leave Team")
          : locale === "ko"
          ? t("subscribe")
          : t("subscribe")}
      </span>
    </button>
  );
}
