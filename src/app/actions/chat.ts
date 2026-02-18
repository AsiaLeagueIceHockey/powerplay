"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/app/actions/push";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  match_id: string | null;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    full_name: string | null;
    email: string;
    position: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  match?: {
    id: string;
    rink?: { name_ko: string; name_en: string };
  } | null;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ============================================
// Get or Create Chat Room
// ============================================
export async function getOrCreateChatRoom(
  otherUserId: string,
  matchId?: string
): Promise<{ roomId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (user.id === otherUserId) {
    return { error: "Cannot chat with yourself" };
  }

  // Check if a room already exists between these two users
  const { data: existingRoom } = await supabase
    .from("chat_rooms")
    .select("id")
    .or(
      `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
    )
    .maybeSingle();

  if (existingRoom) {
    return { roomId: existingRoom.id };
  }

  // Create new room
  const { data: newRoom, error } = await supabase
    .from("chat_rooms")
    .insert({
      participant_1: user.id,
      participant_2: otherUserId,
      match_id: matchId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[CHAT] Error creating room:", error);
    return { error: "Failed to create chat room" };
  }

  return { roomId: newRoom.id };
}

// ============================================
// Get My Chat Rooms (with last message + unread count)
// ============================================
export async function getChatRooms(): Promise<ChatRoom[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get all rooms where user is a participant
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      participant_1,
      participant_2,
      match_id,
      last_message_at,
      created_at
    `
    )
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error || !rooms) {
    console.error("[CHAT] Error fetching rooms:", error);
    return [];
  }

  // For each room, get the other user's profile, last message, and unread count
  const enrichedRooms = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId =
        room.participant_1 === user.id
          ? room.participant_2
          : room.participant_1;

      // Parallel fetch: other user profile, last message, unread count, match info
      const [profileResult, lastMsgResult, unreadResult, matchResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, position")
            .eq("id", otherUserId)
            .single(),
          supabase
            .from("chat_messages")
            .select("content, sender_id, created_at")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .eq("is_read", false)
            .neq("sender_id", user.id),
          room.match_id
            ? supabase
                .from("matches")
                .select("id, rink:rinks(name_ko, name_en)")
                .eq("id", room.match_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      const otherUser = profileResult.data || {
        id: otherUserId,
        full_name: null,
        email: "Unknown",
        position: null,
      };

      // Handle array rink from Supabase
      let matchData = matchResult.data;
      if (matchData?.rink && Array.isArray(matchData.rink)) {
        matchData = { ...matchData, rink: matchData.rink[0] };
      }

      return {
        ...room,
        other_user: otherUser,
        last_message: lastMsgResult.data || undefined,
        unread_count: unreadResult.count || 0,
        match: matchData || null,
      } as ChatRoom;
    })
  );

  return enrichedRooms;
}

// ============================================
// Get Chat Messages (with pagination)
// ============================================
export async function getChatMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<{ messages: ChatMessage[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], error: "Not authenticated" };
  }

  // Verify user is a participant in this room
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("id", roomId)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .maybeSingle();

  if (!room) {
    return { messages: [], error: "Room not found or access denied" };
  }

  let query = supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, content, is_read, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error("[CHAT] Error fetching messages:", error);
    return { messages: [], error: "Failed to fetch messages" };
  }

  // Reverse to show oldest first
  return { messages: (messages || []).reverse() };
}

// ============================================
// Send Chat Message
// ============================================
export async function sendChatMessage(
  roomId: string,
  content: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { success: false, error: "Message cannot be empty" };
  }

  // Verify user is a participant and get room details
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, participant_1, participant_2")
    .eq("id", roomId)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .maybeSingle();

  if (!room) {
    return { success: false, error: "Room not found or access denied" };
  }

  // Insert message
  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content: trimmedContent,
    })
    .select("id, room_id, sender_id, content, is_read, created_at")
    .single();

  if (error) {
    console.error("[CHAT] Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }

  // Send push notification to the other participant
  const otherUserId =
    room.participant_1 === user.id ? room.participant_2 : room.participant_1;

  // Get sender name for push notification
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const senderName =
    senderProfile?.full_name || senderProfile?.email?.split("@")[0] || "Someone";
  
  // Truncate message for push notification
  const previewContent =
    trimmedContent.length > 50
      ? trimmedContent.substring(0, 50) + "..."
      : trimmedContent;

  // Send push to other user (fire and forget)
  sendPushNotification(
    otherUserId,
    `💬 ${senderName}`,
    previewContent,
    `/mypage/chat/${roomId}`
  ).catch((err) => console.error("[CHAT] Push notification error:", err));

  return { success: true, message };
}

// ============================================
// Mark Messages as Read
// ============================================
export async function markMessagesAsRead(
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Mark all unread messages from the OTHER user as read
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .eq("is_read", false)
    .neq("sender_id", user.id);

  if (error) {
    console.error("[CHAT] Error marking messages as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }

  return { success: true };
}

// ============================================
// Get Unread Chat Count (for header badge)
// ============================================
export async function getUnreadChatCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data, error } = await supabase.rpc("get_unread_chat_count", {
    target_user_id: user.id,
  });

  if (error) {
    console.error("[CHAT] Error getting unread count:", error);
    return 0;
  }

  return data || 0;
}

// ============================================
// Get Chat Room Details (for chat page header)
// ============================================
export async function getChatRoomDetails(roomId: string): Promise<{
  room?: {
    id: string;
    other_user: {
      id: string;
      full_name: string | null;
      email: string;
      position: string | null;
    };
    match?: {
      id: string;
      rink?: { name_ko: string; name_en: string };
    } | null;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: room } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      participant_1,
      participant_2,
      match_id
    `
    )
    .eq("id", roomId)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .maybeSingle();

  if (!room) {
    return { error: "Room not found or access denied" };
  }

  const otherUserId =
    room.participant_1 === user.id ? room.participant_2 : room.participant_1;

  const [profileResult, matchResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, position")
      .eq("id", otherUserId)
      .single(),
    room.match_id
      ? supabase
          .from("matches")
          .select("id, rink:rinks(name_ko, name_en)")
          .eq("id", room.match_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const otherUser = profileResult.data || {
    id: otherUserId,
    full_name: null,
    email: "Unknown",
    position: null,
  };

  let matchData = matchResult.data;
  if (matchData?.rink && Array.isArray(matchData.rink)) {
    matchData = { ...matchData, rink: matchData.rink[0] };
  }

  return {
    room: {
      id: room.id,
      other_user: otherUser,
      match: matchData || null,
    },
  };
}
