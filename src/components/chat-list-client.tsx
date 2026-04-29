"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatUserSelector } from "./chat-user-selector";
import { ChatAccessBanner } from "./chat-access-banner";

interface ChatRoom {
  id: string;
  updated_at: string;
  otherParticipant: {
    id: string;
    full_name: string;
    primary_club_id: string | null;
  };
  unreadCount: number;
  lastMessage: string | null;
  // v51 — last message may be a server-emitted system message whose `content`
  // is empty by design. The list shows a localized origin preview instead.
  lastMessageType?: "user" | "system";
  lastMessageMetadata?: Record<string, unknown> | null;
  lastMessageAt: string;
}

function renderSystemPreview(
  metadata: Record<string, unknown> | null | undefined,
  locale: string,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const meta = (metadata ?? {}) as {
    origin_type?: string;
    name?: string;
    clubName?: string;
    clubNameKo?: string;
    clubNameEn?: string;
    date?: string;
    rinkName?: string;
    rinkNameKo?: string;
    rinkNameEn?: string;
  };
  const name = meta.name ?? "";
  if (meta.origin_type === "club") {
    const clubName =
      (locale === "ko" ? meta.clubNameKo : meta.clubNameEn) ??
      meta.clubName ??
      "";
    if (!clubName) return t("systemMessages.unknown", { name });
    return t("systemMessages.club", { name, clubName });
  }
  if (meta.origin_type === "match") {
    const rinkName =
      (locale === "ko" ? meta.rinkNameKo : meta.rinkNameEn) ??
      meta.rinkName ??
      "";
    const date = meta.date ?? "";
    if (!rinkName || !date) return t("systemMessages.unknown", { name });
    return t("systemMessages.match", { name, date, rinkName });
  }
  return t("systemMessages.unknown", { name });
}

export function ChatListClient({ initialRooms, isAuthenticated = true }: { initialRooms: ChatRoom[], isAuthenticated?: boolean }) {
  const t = useTranslations("chat");
  const [isMounted, setIsMounted] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);

    // Setup Realtime for chat list updates
    const channel = supabase
      .channel("chat_rooms_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        async () => {
          // When a new message comes in, refresh the rooms list (or we could fetch just the new message and update state)
          router.refresh(); // Simple approach: use router.refresh() to re-fetch Server Component data
          // However, router.refresh doesn't automatically update our local `rooms` state.
          // For a fully robust approach, we should re-fetch `getChatRooms()` client-side, or let Next.js handle it if we didn't use local state.
          // But since we want real-time unread counts, let's fetch client-side.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  // Keep local state in sync with props changes caused by router.refresh()
  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  if (!isMounted) return null;

  // Render Login Gate
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-[70vh]">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {locale === "ko" ? "로그인이 필요합니다" : "Login Required"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
          {locale === "ko" ? "채팅 서비스를 이용하려면 로그인이 필요합니다." : "Please log in to use the chat service."}
        </p>

        <div className="w-full max-w-xs">
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full flex items-center justify-between px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <span>{locale === "ko" ? "로그인하기" : "Log In"}</span>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pt-safe">
      <header className="px-4 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
        <h1 className="text-xl font-bold dark:text-zinc-100">{t("title")}</h1>
        {/* Temporarily disabled global chat creation
        <button 
          onClick={() => setIsUserSelectorOpen(true)}
          className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
          title={t("newChatTooltip")}
        >
          <Plus size={24} />
        </button>
        */}
      </header>

      <ChatAccessBanner />

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <MessageCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">{t("empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {rooms.map((room) => {
              const lastMessageDate = new Date(room.lastMessageAt);
              const isToday = lastMessageDate.toDateString() === new Date().toDateString();
              const timeString = isToday 
                ? lastMessageDate.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
                : lastMessageDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

              return (
                <Link
                  key={room.id}
                  href={`/${locale}/chat/${room.id}`}
                  className="flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors bg-white dark:bg-zinc-950"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-lg shrink-0">
                    {room.otherParticipant.full_name?.charAt(0) || "U"}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate pr-2">
                        {room.otherParticipant.full_name}
                      </h3>
                      <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                        {timeString}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate pr-4">
                        {room.lastMessageType === "system"
                          ? renderSystemPreview(room.lastMessageMetadata, locale, t)
                          : room.lastMessage || ""}
                      </p>
                      {room.unreadCount > 0 && (
                        <div className="px-2 py-0.5 min-w-[1.25rem] h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                          {room.unreadCount > 99 ? "99+" : room.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ChatUserSelector 
        isOpen={isUserSelectorOpen} 
        onClose={() => setIsUserSelectorOpen(false)} 
      />
    </div>
  );
}
