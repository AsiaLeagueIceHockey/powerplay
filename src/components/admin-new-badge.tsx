"use client";

import { useEffect, useState } from "react";

interface AdminNewBadgeProps {
  matchId: string;
  currentCount: number;
}

/**
 * 새 참가자 뱃지
 * LocalStorage에 저장된 마지막으로 본 참가자 수와 비교하여
 * 새 참가자가 있으면 빨간 뱃지를 표시합니다.
 */
export function AdminNewBadge({ matchId, currentCount }: AdminNewBadgeProps) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const key = `admin_match_seen_${matchId}`;
    const seenCount = parseInt(localStorage.getItem(key) || "0");
    
    if (currentCount > seenCount) {
      setHasNew(true);
    }
  }, [matchId, currentCount]);

  if (!hasNew) return null;

  return (
    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-md z-10 border-2 border-zinc-800">
      <span className="text-white text-[10px] font-bold">N</span>
    </span>
  );
}

/**
 * 참가자 목록을 열었을 때 호출하여 본 것으로 표시
 */
export function markMatchAsSeen(matchId: string, currentCount: number) {
  const key = `admin_match_seen_${matchId}`;
  localStorage.setItem(key, currentCount.toString());
}
