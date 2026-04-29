"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markMessagesAsRead } from "@/app/actions/chat";
import { ChatAccessBanner } from "@/components/chat-access-banner";

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // v51 — server-emitted system messages (chat origin context). Existing rows
  // default to 'user' so older payloads remain shape-compatible.
  message_type?: "user" | "system";
  metadata?: Record<string, unknown> | null;
}

// Whitelist of metadata keys the system-message renderer reads.
// Kept narrow on purpose — anything outside this shape is ignored.
type SystemMessageMetadata = {
  origin_type?: "club" | "match" | string;
  origin_id?: string;
  name?: string;
  clubName?: string;
  clubNameKo?: string;
  clubNameEn?: string;
  date?: string;
  rinkName?: string;
  rinkNameKo?: string;
  rinkNameEn?: string;
};

interface UserProfile {
  id: string;
  full_name: string;
  primary_club_id: string | null;
}

export function ChatRoomClient({
  roomId,
  initialMessages,
  currentUserId,
  otherParticipant,
}: {
  roomId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherParticipant: UserProfile;
}) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = useMemo(() => createClient(), []);
  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll the messages container to the bottom *without* using
  // Element.scrollIntoView — that method bubbles up and scrolls every
  // scrollable ancestor (and the document itself on iOS Safari when the
  // keyboard opens), which previously yanked the footer up to the top of the
  // screen and left a huge gap above the keyboard. Manipulating
  // <main>'s scrollTop directly keeps the scroll local.
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const mainEl = mainRef.current;
    if (!mainEl) return;
    mainEl.scrollTo({ top: mainEl.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // iOS Safari/PWA visualViewport correction.
  // When the on-screen keyboard appears on iOS Safari, the layout viewport
  // (window.innerHeight / 100dvh) does NOT shrink, so the textarea would sit
  // behind the keyboard. We cap the chat root's height to visualViewport.height
  // which pulls the footer up above the keyboard. The `mt-auto` spacer in
  // <main> keeps messages glued to the bottom of the visible area — no extra
  // scroll is needed (and previously calling scrollIntoView here bubbled up
  // and broke the layout, see scrollToBottom comment).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    const root = rootRef.current;
    if (!viewport || !root) return;

    const applyOffset = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height);
      if (offset > 0) {
        root.style.height = `${viewport.height}px`;
        root.style.maxHeight = `${viewport.height}px`;
      } else {
        root.style.height = "";
        root.style.maxHeight = "";
      }
    };

    viewport.addEventListener("resize", applyOffset);
    viewport.addEventListener("scroll", applyOffset);
    applyOffset();

    return () => {
      viewport.removeEventListener("resize", applyOffset);
      viewport.removeEventListener("scroll", applyOffset);
      root.style.height = "";
      root.style.maxHeight = "";
    };
  }, []);

  useEffect(() => {
    // console.log("Establishing Realtime subscription for room:", roomId);
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" }, // Remove filter for robustness
        (payload) => {
          const newMessage = payload.new as Message;
          // console.log("Received new message via Realtime:", newMessage);
          
          // Manual filter check
          if (newMessage.room_id !== roomId) return;

          setMessages((prev) => {
            // 1. Prevent exact ID duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }

            // 2. If it's my message, try to find and replace the optimistic one
            if (newMessage.sender_id === currentUserId) {
              // Find a message with a temporary ID (UUIDv4) that matches content
              // crypto.randomUUID() generates a UUID, so we can check for that
              // or just look for any message from me that isn't the real ID yet
              const optimisticIdx = prev.findLastIndex(
                (msg) => 
                  msg.sender_id === currentUserId && 
                  msg.content === newMessage.content &&
                  msg.id.length > 30 // Rough check for UUID length
              );

              if (optimisticIdx !== -1) {
                const newMessages = [...prev];
                newMessages[optimisticIdx] = newMessage;
                return newMessages;
              }
            }

            return [...prev, newMessage];
          });
          
          // If we received a message from the other person while the room is open, mark it as read
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(roomId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" }, // Remove filter for robustness
        (payload) => {
          const updatedMessage = payload.new as Message;
          if (updatedMessage.room_id !== roomId) return;

          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .subscribe();

    return () => {
      // console.log("Removing Realtime channel for room:", roomId);
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, supabase]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUserId,
      content: content,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Actual API call
    const result = await sendMessage(roomId, content, otherParticipant.id);
    
    if (result.error) {
      // Remove optimistic message on error and show alert
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      alert("Failed to send message: " + result.error);
    } else if (result.message) {
      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) => msg.id === tempId ? result.message : msg)
      );
    }

    setIsSending(false);
    // Keep the keyboard up after sending — user typically wants to keep typing.
    // The mousedown preventDefault on the send button stops focus from leaving
    // in the first place, and this refocus is a defensive fallback for cases
    // where focus drifted (e.g., desktop Enter triggered re-render).
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || (window.innerWidth < 768)) {
        // Mobile behavior: Enter usually means newline, or Shift+Enter on Desktop
        return;
      } else {
        // Desktop behavior: Enter sends message unless Shift is held
        e.preventDefault();
        handleSend();
      }
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
    setInputValue(target.value);
  };

  const formatMessageTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div ref={rootRef} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <header className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-10 pt-safe">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/${locale}/chat`)}
            className="p-1 -ml-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold shrink-0 text-sm">
              {otherParticipant.full_name?.charAt(0) || "U"}
            </div>
            <h2 className="text-lg font-bold dark:text-zinc-100">{otherParticipant.full_name}</h2>
          </div>
        </div>
      </header>

      <ChatAccessBanner />

      <main ref={mainRef} className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-900 mb-safe flex flex-col">
        {/* Spacer pushes the message list to the bottom when content is shorter than the viewport.
            Once messages overflow, this auto margin collapses and natural scrolling takes over. */}
        <div className="mt-auto flex flex-col gap-1">
          {messages.map((message, index) => {
            // System message — origin context bubble emitted by the server
            // (v51 chat_origin RPC). Rendered centered with neutral chip
            // styling, regardless of who triggered the room creation.
            if (message.message_type === "system") {
              const meta = (message.metadata ?? {}) as SystemMessageMetadata;
              const senderName = meta.name ?? "";
              let text: string;
              if (meta.origin_type === "club") {
                const clubName =
                  (locale === "ko" ? meta.clubNameKo : meta.clubNameEn) ??
                  meta.clubName ??
                  "";
                text = clubName
                  ? t("systemMessages.club", { name: senderName, clubName })
                  : t("systemMessages.originDeleted");
              } else if (meta.origin_type === "match") {
                const rinkName =
                  (locale === "ko" ? meta.rinkNameKo : meta.rinkNameEn) ??
                  meta.rinkName ??
                  "";
                const date = meta.date ?? "";
                text = rinkName && date
                  ? t("systemMessages.match", { name: senderName, date, rinkName })
                  : t("systemMessages.originDeleted");
              } else {
                text = t("systemMessages.unknown", { name: senderName });
              }
              return (
                <div key={message.id} className="my-2 flex justify-center">
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-[85%] text-center">
                    {text}
                  </span>
                </div>
              );
            }

            const isMine = message.sender_id === currentUserId;
            const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== message.sender_id;

            return (
              <div
                key={message.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isLastInGroup ? 'mb-2' : ''}`}
              >
                <div className={`flex items-end gap-1.5 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl break-words whitespace-pre-wrap ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50 rounded-bl-sm'
                    }`}
                  >
                    {message.content}
                  </div>

                  <div className={`flex flex-col gap-0.5 text-[10px] text-zinc-400 ${isMine ? 'items-end' : 'items-start'}`}>
                    {isMine && !message.is_read && (
                      <span className="text-blue-500 font-semibold px-0.5">1</span>
                    )}
                    {isLastInGroup && (
                      <span className="whitespace-nowrap pb-0.5">{formatMessageTime(message.created_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={adjustTextareaHeight}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            className="flex-1 max-h-32 min-h-[44px] block w-full resize-none rounded-2xl border-0 py-2.5 pl-4 pr-12 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            // preventDefault on mousedown blocks the focus shift from textarea
            // to the button on tap, so iOS Safari does NOT dismiss the keyboard.
            // The click event still fires and submits the form normally.
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-2 bottom-1.5 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
