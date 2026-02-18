import { getChatMessages, getChatRoomDetails } from "@/app/actions/chat";
import { ChatMessageView } from "@/components/chat-message-view";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ locale: string; roomId: string }>;
}) {
  const { locale, roomId } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Fetch room details and initial messages in parallel
  const [roomResult, messagesResult] = await Promise.all([
    getChatRoomDetails(roomId),
    getChatMessages(roomId),
  ]);

  if (roomResult.error || !roomResult.room) {
    notFound();
  }

  const room = roomResult.room;
  const otherUserName =
    room.other_user.full_name || room.other_user.email || "User";

  return (
    <div className="flex flex-col h-[calc(100vh-64px-16px)] md:h-[600px] max-w-2xl mx-auto md:my-8 bg-white dark:bg-zinc-900 md:rounded-2xl md:border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10">
        <Link
          href={`/${locale}/mypage/chat`}
          className="p-1 -ml-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-zinc-900 dark:text-white truncate">
            {otherUserName}
          </h1>
          {room.match?.rink && (
            <p className="text-xs text-zinc-500 truncate">
              {locale === "ko"
                ? room.match.rink.name_ko
                : room.match.rink.name_en || room.match.rink.name_ko}
            </p>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900">
        <ChatMessageView
          roomId={roomId}
          currentUserId={user.id}
          initialMessages={messagesResult.messages}
          otherUserName={otherUserName}
        />
      </div>
    </div>
  );
}
