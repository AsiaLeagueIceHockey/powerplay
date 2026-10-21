import { getChatRooms } from "@/app/actions/chat";
import { ChatListClient } from "@/components/chat-list-client";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { rooms } = await getChatRooms();

  return (
    <div className="flex flex-col h-full bg-pp-surface pb-16">
      <ChatListClient initialRooms={rooms} isAuthenticated={!!user} />
    </div>
  );
}
