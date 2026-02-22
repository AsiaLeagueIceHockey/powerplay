"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useNotification } from "@/contexts/notification-context";
import { MessageCircle, BellOff, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatUserSelector } from "./chat-user-selector";

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
  lastMessageAt: string;
}

export function ChatListClient({ initialRooms }: { initialRooms: ChatRoom[] }) {
  const t = useTranslations("chat");
  const { hasDbSubscription, openGuide } = useNotification();
  const [isStandalone, setIsStandalone] = useState<boolean>(true); // Optimistic true on SSR to avoid flash
  const [isMounted, setIsMounted] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
    const checkStandalone = () => {
      const isPwa = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
      setIsStandalone(isPwa);
    };
    checkStandalone();
    
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

  // Render PWA/Push Gate
  if (!isStandalone || !hasDbSubscription) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-[70vh]">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
          <BellOff className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {t("pwaRequiredTitle")}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
          {t("pwaRequiredDesc")}
        </p>

        <div className="space-y-3 w-full max-w-xs">
          {!isStandalone && (
            <button
              onClick={() => openGuide("install")}
              className="w-full flex items-center justify-between px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium transition-colors"
            >
              <span>{t("installPwa")}</span>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </button>
          )}
          {isStandalone && !hasDbSubscription && (
            <button
              onClick={() => openGuide("notification")}
              className="w-full flex items-center justify-between px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <span>{t("enablePush")}</span>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pt-safe">
      <header className="px-4 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
        <h1 className="text-xl font-bold dark:text-zinc-100">{t("title")}</h1>
        <button 
          onClick={() => setIsUserSelectorOpen(true)}
          className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
          title={t("newChatTooltip")}
        >
          <Plus size={24} />
        </button>
      </header>

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
                        {room.lastMessage || ""}
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
