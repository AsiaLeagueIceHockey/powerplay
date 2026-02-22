import { getChatMessages, markMessagesAsRead } from "@/app/actions/chat";
import { ChatRoomClient } from "@/components/chat-room-client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ locale: string; roomId: string }>;
}) {
  const { locale, roomId } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Fetch the room definition to get participants and verify access
  const { data: room, error: roomError } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      p1:participant1_id (id, full_name, primary_club_id),
      p2:participant2_id (id, full_name, primary_club_id)
    `)
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    redirect(`/${locale}/chat`);
  }

  const p1 = room.p1 as unknown as { id: string; full_name: string; primary_club_id: string | null };
  const p2 = room.p2 as unknown as { id: string; full_name: string; primary_club_id: string | null };

  const isParticipant1 = p1.id === user.id;
  const isParticipant2 = p2.id === user.id;

  if (!isParticipant1 && !isParticipant2) {
    redirect(`/${locale}/chat`);
  }

  const otherParticipant = isParticipant1 ? p2 : p1;

  // Mark all unread messages as read when opening the room
  await markMessagesAsRead(roomId);

  const { messages } = await getChatMessages(roomId);

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-zinc-950">
      <ChatRoomClient 
        roomId={roomId}
        initialMessages={messages}
        currentUserId={user.id}
        otherParticipant={otherParticipant}
      />
    </div>
  );
}
