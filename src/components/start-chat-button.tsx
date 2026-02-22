"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { createOrGetRoom } from "@/app/actions/chat";
import { useTranslations } from "next-intl";

interface StartChatButtonProps {
  targetUserId: string;
  className?: string;
  iconOnly?: boolean;
  label?: string;
}

export function StartChatButton({
  targetUserId,
  className = "",
  iconOnly = false,
  label,
}: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleStartChat = async () => {
    try {
      setIsLoading(true);
      const result = await createOrGetRoom(targetUserId);
      if ("room" in result && result.room && result.room.id) {
        // Router will prepend the locale automatically if configured, or we can use a Link
        // For server actions pushing, we rely on the action, but client side pushing:
        const locale = document.documentElement.lang || "ko";
        router.push(`/${locale}/chat/${result.room.id}`);
      } else if ("error" in result) {
        console.error("Failed to start chat:", result.error);
        alert(t("common.error"));
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(t("common.error"));
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
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {!iconOnly && <span>{label || t("match.contactManager")}</span>}
    </button>
  );
}
