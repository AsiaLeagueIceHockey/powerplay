"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/app/actions/push";
import { logAndNotify } from "@/lib/audit";

// ============================================
// Create or Get Room
// ============================================

/**
 * Origin context for a chat room. When provided to `createOrGetRoom` and the
 * room is newly created, a system message is emitted server-side describing
 * where the chat was started from.
 */
export type ChatOrigin = {
  type: "club" | "match";
  id: string;
  // Free-form metadata used purely for i18n template rendering on the client.
  // Must not contain PII. Whitelisted keys consumed by chat-room-client.tsx:
  //   { name, clubName, clubNameKo, clubNameEn, date, rinkName, rinkNameKo, rinkNameEn }
  metadata?: Record<string, unknown>;
};

export type CreateOrGetRoomResult =
  | { ok: true; roomId: string; wasCreated: boolean }
  | {
      ok: false;
      code: "cannot_chat_with_self" | "unauthorized" | "invalid_target" | "unknown";
      message?: string;
    };

type CreateOrGetRoomRpcRow = {
  room_id: string;
  was_created: boolean;
};

function mapRpcErrorCode(message: string | undefined): CreateOrGetRoomResult {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("cannot_chat_with_self")) {
    return { ok: false, code: "cannot_chat_with_self", message };
  }
  if (lower.includes("unauthorized")) {
    return { ok: false, code: "unauthorized", message };
  }
  if (lower.includes("invalid_target")) {
    return { ok: false, code: "invalid_target", message };
  }
  return { ok: false, code: "unknown", message };
}

export async function createOrGetRoom(
  targetUserId: string,
  origin?: ChatOrigin
): Promise<CreateOrGetRoomResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  // Resolve sender display name once (server-side) so callers don't have to
  // pass it from every entry point. Falls back to empty string — the client
  // i18n template tolerates missing names gracefully.
  let resolvedMetadata: Record<string, unknown> | null = null;
  if (origin) {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const senderName = senderProfile?.full_name ?? "";
    resolvedMetadata = {
      ...(origin.metadata ?? {}),
      // metadata.name is the canonical sender display name consumed by
      // chat.systemMessages.* i18n templates. Caller-provided `name` is
      // overridden to keep the source of truth on the server.
      name: senderName,
    };
  }

  const { data, error } = await supabase.rpc("create_or_get_chat_room_with_origin", {
    p_target_user_id: targetUserId,
    p_origin_type: origin?.type ?? null,
    p_origin_id: origin?.id ?? null,
    p_metadata: resolvedMetadata,
  });

  if (error) {
    console.error("Error creating/getting chat room:", error);
    return mapRpcErrorCode(error.message);
  }

  const rows = (data ?? []) as CreateOrGetRoomRpcRow[];
  const row = rows[0];
  if (!row || !row.room_id) {
    return { ok: false, code: "unknown", message: "Empty RPC response" };
  }

  // Audit log on first creation only (matches v50 behavior — chat creation event).
  if (row.was_created) {
    const { data: p1Profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const { data: p2Profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", targetUserId)
      .single();
    const p1Name = p1Profile?.full_name || user.id;
    const p2Name = p2Profile?.full_name || targetUserId;

    await logAndNotify({
      userId: user.id,
      action: "CHAT_CREATE",
      description: `새로운 채팅방이 개설되었습니다. (${p1Name} 님과 ${p2Name} 님)`,
      metadata: { room_id: row.room_id, origin_type: origin?.type ?? null },
    });
  }

  return { ok: true, roomId: row.room_id, wasCreated: row.was_created };
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
      // Unread count: messages in this room NOT sent by the current user AND is_read = false.
      // Defensive `message_type='user'` filter — the RPC inserts system messages with
      // `is_read=true`, but this guards against future code paths or manual data fixes.
      const { count: unreadCount } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .eq("message_type", "user");

      // Latest message — fetch type so the client can render system messages with
      // their own template instead of the empty `content` string.
      const { data: latestMessages } = await supabase
        .from("chat_messages")
        .select("content, created_at, message_type, metadata")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const otherParticipant = room.p1.id === user.id ? room.p2 : room.p1;
      const latest = latestMessages?.[0];

      return {
        id: room.id,
        updated_at: room.updated_at,
        otherParticipant,
        unreadCount: unreadCount || 0,
        lastMessage: latest?.content ?? null,
        lastMessageType: (latest?.message_type ?? "user") as "user" | "system",
        lastMessageMetadata: (latest?.metadata ?? null) as Record<string, unknown> | null,
        lastMessageAt: latest?.created_at || room.updated_at,
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

  const { data: newMessage, error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (insertError || !newMessage) {
    console.error("Error sending message:", insertError);
    return { error: insertError?.message || "Failed to insert message" };
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

  // 첫 메시지 여부 확인 (email_notified_at IS NULL = 아직 이메일 미발송)
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("email_notified_at")
    .eq("id", roomId)
    .single();

  const isFirstMessage = room?.email_notified_at == null;

  // push는 매번, email은 첫 메시지만
  await sendPushNotification(
    receiverId,
    senderName,
    content,
    `/chat/${roomId}`,
    { skipEmail: !isFirstMessage }
  );

  // 첫 메시지라면 email_notified_at 기록 (이후 메시지는 이메일 생략)
  if (isFirstMessage) {
    await supabase
      .from("chat_rooms")
      .update({ email_notified_at: new Date().toISOString() })
      .eq("id", roomId);
  }

  return { success: true, message: newMessage };
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
