"use client";

import { Club } from "@/app/actions/types";
import { joinClub } from "@/app/actions/clubs";
import { useState } from "react";
import { useLocale } from "next-intl";

interface JoinClubButtonProps {
  club: Club;
  initialIsMember: boolean;
}

export function JoinClubButton({ club, initialIsMember }: JoinClubButtonProps) {
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
    <button
      onClick={handleJoin}
      disabled={isMember || loading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
        isMember 
          ? "bg-zinc-100 text-zinc-400 cursor-default" 
          : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
      }`}
    >
      {loading
        ? "..."
        : isMember
        ? (locale === "ko" ? "가입됨" : "Joined")
        : (locale === "ko" ? "동호회 가입하기" : "Join Club")}
    </button>
  );
}
