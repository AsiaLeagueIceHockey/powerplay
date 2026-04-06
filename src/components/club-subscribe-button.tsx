"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";

import { subscribeToClubNews } from "@/app/actions/clubs";
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

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }

    if (subscribed) {
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
          ? "소식 구독 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요."
          : "Something went wrong while subscribing. Please try again."
      );
      return;
    }

    setSubscribed(true);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={subscribed || isSubmitting}
      className={`${clubDetailActionButtonClass} border border-zinc-200 transition-all ${
        subscribed || isSubmitting
          ? "bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          : "bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      <Bell
        strokeWidth={2.25}
        className={`${clubDetailActionIconClass} ${subscribed || isSubmitting ? "" : "text-zinc-900 dark:text-white"}`}
      />
      <span className={clubDetailActionLabelClass}>
        {isSubmitting
          ? "..."
          : subscribed
          ? locale === "ko"
            ? t("subscribed")
            : t("subscribed")
          : locale === "ko"
          ? t("subscribe")
          : t("subscribe")}
      </span>
    </button>
  );
}
