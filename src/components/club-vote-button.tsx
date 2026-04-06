"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Heart } from "lucide-react";

import { castClubVote } from "@/app/actions/clubs";

interface ClubVoteButtonProps {
  clubId: string;
  isLoggedIn: boolean;
  didVoteToday: boolean;
  className?: string;
}

export function ClubVoteButton({
  clubId,
  isLoggedIn,
  didVoteToday,
  className = "",
}: ClubVoteButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }

    setIsSubmitting(true);
    const result = await castClubVote(clubId);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.error === "AUTH_REQUIRED") {
        router.push(`/${locale}/login`);
        return;
      }

      if (result.error === "ALREADY_VOTED_TODAY") {
        alert(locale === "ko" ? "이 동호회에는 오늘 이미 투표했어요." : "You already voted for this club today.");
        return;
      }

      if (result.error === "DAILY_LIMIT_REACHED") {
        alert(locale === "ko" ? "오늘 사용할 수 있는 3표를 모두 사용했어요." : "You already used all 3 votes for today.");
        return;
      }

      alert(
        locale === "ko"
          ? "투표 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요."
          : "Something went wrong while casting your vote. Please try again."
      );
      return;
    }

    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={didVoteToday || isSubmitting}
      className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-3.5 text-sm font-bold leading-none transition-all sm:px-4 ${
        didVoteToday || isSubmitting
          ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
          : "bg-rose-100 text-zinc-900 hover:bg-rose-200"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${didVoteToday || isSubmitting ? "" : "fill-rose-500 text-rose-500"}`} />
      {isSubmitting
        ? "..."
        : didVoteToday
        ? locale === "ko"
          ? "오늘 투표 완료"
          : "Voted today"
        : locale === "ko"
        ? "응원 투표"
        : "Vote"}
    </button>
  );
}
