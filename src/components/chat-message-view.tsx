"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage, markMessagesAsRead } from "@/app/actions/chat";
import type { ChatMessage } from "@/app/actions/chat";
import { ChatInput } from "@/components/chat-input";
import { useTranslations } from "next-intl";

interface ChatMessageViewProps {
  roomId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  otherUserName: string;
}

export function ChatMessageView({
  roomId,
  currentUserId,
  initialMessages,
  otherUserName,
}: ChatMessageViewProps) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mark messages as read on mount
  useEffect(() => {
    markMessagesAsRead(roomId);
  }, [roomId]);

  // Subscribe to Realtime changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from the other user
          if (newMsg.sender_id !== currentUserId) {
            markMessagesAsRead(roomId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  // Send message handler
  const handleSend = async (content: string) => {
    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const result = await sendChatMessage(roomId, content);
    if (!result.success) {
      // Remove optimistic message on failure
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMsg.id)
      );
    } else if (result.message) {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? result.message! : m
        )
      );
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });
  };

  // Format date divider
  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    });
  };

  // Check if we need a date divider
  const needsDateDivider = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].created_at).toLocaleDateString(
      "ko-KR",
      { timeZone: "Asia/Seoul" }
    );
    const prev = new Date(messages[index - 1].created_at).toLocaleDateString(
      "ko-KR",
      { timeZone: "Asia/Seoul" }
    );
    return curr !== prev;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm">{t("noMessages")}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id}>
                {/* Date divider */}
                {needsDateDivider(index) && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      {formatDateDivider(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`flex ${
                    isMe ? "justify-end" : "justify-start"
                  } mb-1`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Time (show on last consecutive message from same sender) */}
                {(index === messages.length - 1 ||
                  messages[index + 1]?.sender_id !== msg.sender_id ||
                  needsDateDivider(index + 1)) && (
                  <div
                    className={`flex ${
                      isMe ? "justify-end" : "justify-start"
                    } mb-2`}
                  >
                    <span className="text-[10px] text-zinc-400 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
