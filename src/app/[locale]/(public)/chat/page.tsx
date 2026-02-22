import { getChatRooms } from "@/app/actions/chat";
import { ChatListClient } from "@/components/chat-list-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { rooms } = await getChatRooms();

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 pb-16">
      <ChatListClient initialRooms={rooms} />
    </div>
  );
}
