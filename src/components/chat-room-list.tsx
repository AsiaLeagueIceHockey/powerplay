"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import type { ChatRoom } from "@/app/actions/chat";

interface ChatRoomListProps {
  rooms: ChatRoom[];
}

export function ChatRoomList({ rooms }: ChatRoomListProps) {
  const t = useTranslations("chat");
  const locale = useLocale();

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {t("empty")}
        </p>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Seoul",
      });
    } else if (diffDays === 1) {
      return locale === "ko" ? "어제" : "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
        weekday: "short",
        timeZone: "Asia/Seoul",
      });
    } else {
      return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
        month: "short",
        day: "numeric",
        timeZone: "Asia/Seoul",
      });
    }
  };

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {rooms.map((room) => (
        <Link
          key={room.id}
          href={`/${locale}/mypage/chat/${room.id}`}
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          {/* Avatar placeholder */}
          <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
              {(
                room.other_user.full_name ||
                room.other_user.email ||
                "?"
              )
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                {room.other_user.full_name ||
                  room.other_user.email?.split("@")[0]}
              </span>
              {room.last_message && (
                <span className="text-[11px] text-zinc-400 flex-shrink-0">
                  {formatTime(room.last_message.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {room.last_message?.content || t("noMessages")}
              </p>
              {room.unread_count > 0 && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {room.unread_count > 99 ? "99+" : room.unread_count}
                </span>
              )}
            </div>
            {/* Match context */}
            {room.match?.rink && (
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                🏒{" "}
                {locale === "ko"
                  ? room.match.rink.name_ko
                  : room.match.rink.name_en || room.match.rink.name_ko}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
