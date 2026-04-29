"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { createOrGetRoom, type ChatOrigin } from "@/app/actions/chat";
import { useTranslations } from "next-intl";

interface StartChatButtonProps {
  targetUserId: string;
  className?: string;
  iconOnly?: boolean;
  label?: string;
  /**
   * Optional context describing where this chat was started from. When
   * provided and the chat room is newly created, the server emits a system
   * message ("X started this chat from the [club Y] page") so the recipient
   * sees the entry point. Re-opening an existing room does not duplicate it.
   */
  origin?: ChatOrigin;
}

export function StartChatButton({
  targetUserId,
  className = "",
  iconOnly = false,
  label,
  origin,
}: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleStartChat = async () => {
    try {
      setIsLoading(true);
      const result = await createOrGetRoom(targetUserId, origin);
      if (result.ok) {
        const locale = document.documentElement.lang || "ko";
        router.push(`/${locale}/chat/${result.roomId}`);
        return;
      }
      // Failure path — surface a specific reason when known.
      if (result.code === "cannot_chat_with_self") {
        alert(t("chat.cannotChatWithSelf"));
      } else {
        console.error("Failed to start chat:", result.code, result.message);
        alert(t("chat.startChatFailed"));
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(t("chat.startChatFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${className}`}
      title={label || t("chat.newChatTooltip")}
    >
      {isLoading ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      ) : (
        <MessageCircle className="h-[18px] w-[18px]" />
      )}
      {!iconOnly && <span>{label || t("match.contactManager")}</span>}
    </button>
  );
}
