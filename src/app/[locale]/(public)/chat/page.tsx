import { getChatRooms } from "@/app/actions/chat";
import { ChatListClient } from "@/components/chat-list-client";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { rooms } = await getChatRooms();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 pb-16">
      <ChatListClient initialRooms={rooms} isAuthenticated={!!user} />
    </div>
  );
}
