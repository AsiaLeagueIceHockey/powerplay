"use client";

import { buttonStyles } from "@/components/ui/styles";

import { Club } from "@/app/actions/types";
import { joinClub } from "@/app/actions/clubs";
import { useState } from "react";
import { useLocale } from "next-intl";

interface JoinClubButtonProps {
  club: Club;
  initialIsMember: boolean;
}

export function JoinClubButton({ club, initialIsMember, className }: JoinClubButtonProps & { className?: string }) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [loading, setLoading] = useState(false);
  const locale = useLocale();

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isMember) return;
    
    if (!confirm(locale === "ko" ? "이 동호회에 가입하시겠습니까?" : "Do you want to join this club?")) {
      return;
    }

    setLoading(true);
    const res = await joinClub(club.id);
    
    if (res.error) {
      if (res.error === "Not authenticated") {
         alert(locale === "ko" ? "로그인이 필요합니다." : "Please login first.");
         // Optionally redirect.
      } else {
         alert(locale === "ko" ? "가입 실패: " + res.error : "Failed to join: " + res.error);
      }
    } else {
      setIsMember(true);
      alert(locale === "ko" ? "가입되었습니다!" : "Successfully joined!");
    }
    setLoading(false);
  };

  return (
    <button type="button"
      onClick={handleJoin}
      disabled={isMember || loading}
      className={`${buttonStyles({ variant: isMember ? "secondary" : "primary", size: "default" })} ${className || ""}`}
    >
      {loading
        ? "..."
        : isMember
        ? (locale === "ko" ? "가입됨" : "Joined")
        : (locale === "ko" ? "동호회 가입하기" : "Join Club")}
    </button>
  );
}
