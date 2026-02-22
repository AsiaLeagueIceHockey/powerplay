"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/app/actions/push";
import { logAndNotify } from "@/lib/audit";

// ============================================
// Create or Get Room
// ============================================
export async function createOrGetRoom(targetUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Ensure participants are ordered lexicographically
  const p1 = user.id < targetUserId ? user.id : targetUserId;
  const p2 = user.id < targetUserId ? targetUserId : user.id;

  // First, try to find an existing room
  const { data: existingRoom, error: fetchError } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("participant1_id", p1)
    .eq("participant2_id", p2)
    .single();

  if (existingRoom) {
    return { room: existingRoom };
  }

  // If not found, create one
  const { data: newRoom, error: createError } = await supabase
    .from("chat_rooms")
    .insert({
      participant1_id: p1,
      participant2_id: p2,
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating chat room:", createError);
    return { error: createError.message };
  }

  // Get names for logging purposes
  const { data: p1Profile } = await supabase.from("profiles").select("full_name").eq("id", p1).single();
  const { data: p2Profile } = await supabase.from("profiles").select("full_name").eq("id", p2).single();
  const p1Name = p1Profile?.full_name || p1;
  const p2Name = p2Profile?.full_name || p2;

  await logAndNotify({
    userId: user.id,
    action: "CHAT_CREATE",
    description: `새로운 채팅방이 개설되었습니다. (${p1Name} 님과 ${p2Name} 님)`,
    metadata: { room_id: newRoom.id, p1, p2 },
  });

  return { room: newRoom };
}

// ============================================
// Get My Chat Rooms
// ============================================
export async function getChatRooms() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rooms: [] };
  }

  // Fetch all rooms where user is participant
  // We'll also fetch the profiles of both participants so we can easily show the "other" person's name
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      updated_at,
      p1:participant1_id (id, full_name, primary_club_id),
      p2:participant2_id (id, full_name, primary_club_id)
      -- We'll fetch the last message client-side or below
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error || !rooms) {
    console.error("Error fetching chat rooms:", error);
    return { rooms: [] };
  }

  // Fetch unread count for each room for the current user
  const roomsWithMetadata = await Promise.all(
    rooms.map(async (room: any) => {
      // Unread count: messages in this room NOT sent by the current user AND is_read = false
      const { count: unreadCount } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      // Latest message
      const { data: latestMessages } = await supabase
        .from("chat_messages")
        .select("content, created_at")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const otherParticipant = room.p1.id === user.id ? room.p2 : room.p1;

      return {
        id: room.id,
        updated_at: room.updated_at,
        otherParticipant,
        unreadCount: unreadCount || 0,
        lastMessage: latestMessages?.[0]?.content || null,
        lastMessageAt: latestMessages?.[0]?.created_at || room.updated_at,
      };
    })
  );

  return { rooms: roomsWithMetadata };
}

// ============================================
// Get Chat Messages for a Room
// ============================================
export async function getChatMessages(roomId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [] };
  }

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    return { messages: [] };
  }

  return { messages: messages || [] };
}

// ============================================
// Send Message
// ============================================
export async function sendMessage(roomId: string, content: string, receiverId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content,
    });

  if (insertError) {
    console.error("Error sending message:", insertError);
    return { error: insertError.message };
  }

  // Get sender's profile for the push notification title
  let senderName = "PowerPlay 유저";
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  
  if (profile?.full_name) {
    senderName = profile.full_name;
  }

  // Send push notification to receiver
  // The url points directly to the chat room
  await sendPushNotification(
    receiverId,
    senderName,
    content,
    `/chat/${roomId}`
  );

  return { success: true };
}

// ============================================
// Mark Messages as Read
// ============================================
export async function markMessagesAsRead(roomId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Mark all messages in the room sent by someone else as read
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking messages as read:", error);
    return { error: error.message };
  }

  return { success: true };
}
