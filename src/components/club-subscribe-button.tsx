"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { UserPlus, Check, UserMinus } from "lucide-react";

import { subscribeToClubNews, unsubscribeFromClubNews } from "@/app/actions/clubs";
import {
  clubDetailActionButtonClass,
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
      className={`${clubDetailActionButtonClass} border transition-all ${
        subscribed
          ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      {isSubmitting ? (
        <span className="w-5 h-5 block opacity-50" />
      ) : subscribed ? (
        <UserMinus strokeWidth={2.25} className={`${clubDetailActionIconClass}`} />
      ) : (
        <UserPlus
          strokeWidth={2.25}
          className={`${clubDetailActionIconClass} text-zinc-900 dark:text-white`}
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
