"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, MessageCircleMore, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { getChatRooms } from "@/app/actions/chat";
import { createClient } from "@/lib/supabase/client";

interface ChatRoomSummary {
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

interface ChatToastState {
  roomId: string;
  participantName: string;
  preview: string | null;
  unreadCount: number;
}

interface ChatUnreadContextValue {
  totalUnreadCount: number;
  unreadRoomCount: number;
  rooms: ChatRoomSummary[];
  refreshUnreadState: () => Promise<void>;
}

const ChatUnreadContext = createContext<ChatUnreadContextValue | undefined>(undefined);

export function ChatUnreadProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("chat");
  const supabase = useMemo(() => createClient(), []);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [toast, setToast] = useState<ChatToastState | null>(null);
  const roomsRef = useRef<ChatRoomSummary[]>([]);
  const isAuthenticatedRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const queuedRefreshRef = useRef(false);

  const showUnreadToast = useCallback((previousRooms: ChatRoomSummary[], nextRooms: ChatRoomSummary[]) => {
    const previousByRoom = new Map(previousRooms.map((room) => [room.id, room]));

    const increasedRoom = nextRooms.find((room) => {
      const previousUnread = previousByRoom.get(room.id)?.unreadCount ?? 0;
      return room.unreadCount > previousUnread;
    });

    if (!increasedRoom) {
      return;
    }

    if (pathname === `/${locale}/chat/${increasedRoom.id}`) {
      return;
    }

    setToast({
      roomId: increasedRoom.id,
      participantName: increasedRoom.otherParticipant.full_name || t("unknownUser"),
      preview: increasedRoom.lastMessage,
      unreadCount: increasedRoom.unreadCount,
    });
  }, [locale, pathname, t]);

  const syncRooms = useCallback(async (showToastOnIncrease: boolean = false) => {
    if (!isAuthenticatedRef.current) {
      roomsRef.current = [];
      setRooms([]);
      return;
    }

    if (isRefreshingRef.current) {
      queuedRefreshRef.current = queuedRefreshRef.current || showToastOnIncrease;
      return;
    }

    isRefreshingRef.current = true;

    try {
      const previousRooms = roomsRef.current;
      const result = await getChatRooms();
      const nextRooms = result.rooms ?? [];

      roomsRef.current = nextRooms;
      setRooms(nextRooms);

      if (showToastOnIncrease) {
        showUnreadToast(previousRooms, nextRooms);
      }
    } catch (error) {
      console.error("Failed to sync unread chat state:", error);
    } finally {
      isRefreshingRef.current = false;

      if (queuedRefreshRef.current) {
        const shouldShowToast = queuedRefreshRef.current;
        queuedRefreshRef.current = false;
        void syncRooms(shouldShowToast);
      }
    }
  }, [showUnreadToast]);

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive) {
        return;
      }

      isAuthenticatedRef.current = Boolean(user);

      if (!user) {
        roomsRef.current = [];
        setRooms([]);
        return;
      }

      await syncRooms(false);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      isAuthenticatedRef.current = Boolean(session?.user);

      if (!session?.user) {
        roomsRef.current = [];
        setRooms([]);
        setToast(null);
        return;
      }

      void syncRooms(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase, syncRooms]);

  useEffect(() => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    const channel = supabase
      .channel("chat_unread_global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          void syncRooms(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, syncRooms]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const totalUnreadCount = useMemo(
    () => rooms.reduce((sum, room) => sum + room.unreadCount, 0),
    [rooms]
  );
  const unreadRoomCount = useMemo(
    () => rooms.filter((room) => room.unreadCount > 0).length,
    [rooms]
  );

  return (
    <ChatUnreadContext.Provider
      value={{
        totalUnreadCount,
        unreadRoomCount,
        rooms,
        refreshUnreadState: async () => {
          await syncRooms(false);
        },
      }}
    >
      {children}

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-xl shadow-blue-900/10 backdrop-blur dark:border-blue-900/60 dark:bg-zinc-950/95">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                <MessageCircleMore className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("toastTitle")}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {t("toastDescription", {
                    name: toast.participantName,
                    count: toast.unreadCount,
                  })}
                </p>
                {toast.preview ? (
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {toast.preview}
                  </p>
                ) : null}

                <div className="mt-3">
                  <Link
                    href={`/${locale}/chat/${toast.roomId}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span>{t("toastAction")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label={t("toastDismiss")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  const context = useContext(ChatUnreadContext);

  if (!context) {
    throw new Error("useChatUnread must be used within a ChatUnreadProvider");
  }

  return context;
}
