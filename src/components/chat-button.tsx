"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getOrCreateChatRoom } from "@/app/actions/chat";

interface ChatButtonProps {
  otherUserId: string;
  matchId?: string;
  currentUserId?: string;
  locale: string;
}

export function ChatButton({
  otherUserId,
  matchId,
  currentUserId,
  locale,
}: ChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Don't show button if it's yourself or not logged in
  if (!currentUserId || currentUserId === otherUserId) {
    return null;
  }

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await getOrCreateChatRoom(otherUserId, matchId);
      if (result.roomId) {
        router.push(`/${locale}/mypage/chat/${result.roomId}`);
      } else {
        console.error("Failed to create chat room:", result.error);
        alert("채팅방을 생성할 수 없습니다.");
      }
    } catch (error) {
      console.error("Error creating chat room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-blue-500 ${
        loading ? "opacity-50 cursor-wait" : ""
      }`}
      title="메시지 보내기"
    >
      <MessageCircle className="w-4 h-4" />
    </button>
  );
}
