"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markMessagesAsRead } from "@/app/actions/chat";

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // If we received a message from the other person while the room is open, mark it as read
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(roomId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Actual API call. We rely purely on Realtime for UI updates to avoid duplicates.
    const result = await sendMessage(roomId, content, otherParticipant.id);
    
    if (result.error) {
      alert("Failed to send message: " + result.error);
    }

    setIsSending(false);
  };

  const formatMessageTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col flex-1 h-[100dvh] overflow-hidden">
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

      <main className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-900 mb-safe flex flex-col gap-1">
        {messages.map((message, index) => {
          const isMine = message.sender_id === currentUserId;
          const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender_id !== message.sender_id;

          return (
            <div 
              key={message.id} 
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isLastInGroup ? 'mb-2' : ''}`}
            >
              <div className={`flex items-end gap-1.5 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                <div 
                  className={`px-4 py-2.5 rounded-2xl break-words ${
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
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={t("inputPlaceholder")}
            className="flex-1 max-h-32 min-h-[44px] block w-full resize-none rounded-2xl border-0 py-2.5 pl-4 pr-12 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            rows={1}
            style={{ overflow: 'hidden' }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="absolute right-2 bottom-1.5 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
