-- =============================================
-- v25: Chat System (User-to-User 1:1 Messaging)
-- =============================================

-- =============================================
-- 1. TABLES
-- =============================================

-- Chat Rooms (1:1 conversations between users)
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,  -- optional match context
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate rooms between same two users (order-independent)
    CONSTRAINT unique_chat_pair UNIQUE (
        LEAST(participant_1, participant_2),
        GREATEST(participant_1, participant_2)
    ),

    -- Prevent chatting with yourself
    CONSTRAINT no_self_chat CHECK (participant_1 != participant_2)
);

COMMENT ON TABLE chat_rooms IS '1:1 chat rooms between users';
COMMENT ON COLUMN chat_rooms.match_id IS 'Optional reference to the match that initiated this conversation';
COMMENT ON COLUMN chat_rooms.last_message_at IS 'Timestamp of the last message, used for sorting room list';

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Messages within chat rooms';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the recipient has read this message';

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX idx_chat_rooms_participant_1 ON chat_rooms(participant_1);
CREATE INDEX idx_chat_rooms_participant_2 ON chat_rooms(participant_2);
CREATE INDEX idx_chat_rooms_last_message_at ON chat_rooms(last_message_at DESC);
CREATE INDEX idx_chat_messages_room_id_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(room_id, sender_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- 3. TRIGGERS
-- =============================================

-- Auto-update last_message_at on chat_rooms when a new message is inserted
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET last_message_at = NEW.created_at
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_chat_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_room_last_message();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- 4.1 Chat Rooms Policies
-- -----------------------------------------

-- Users can only see rooms they participate in
CREATE POLICY "Users can view own chat rooms"
    ON chat_rooms FOR SELECT
    TO authenticated
    USING (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- Users can create rooms where they are a participant
CREATE POLICY "Users can create chat rooms"
    ON chat_rooms FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- -----------------------------------------
-- 4.2 Chat Messages Policies
-- -----------------------------------------

-- Users can read messages in rooms they participate in
CREATE POLICY "Users can view messages in own rooms"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.participant_1 = auth.uid() OR chat_rooms.participant_2 = auth.uid())
        )
    );

-- Users can send messages in rooms they participate in (as themselves)
CREATE POLICY "Users can send messages in own rooms"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.participant_1 = auth.uid() OR chat_rooms.participant_2 = auth.uid())
        )
    );

-- Users can update (mark as read) messages sent TO them
CREATE POLICY "Users can mark messages as read"
    ON chat_messages FOR UPDATE
    TO authenticated
    USING (
        sender_id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (chat_rooms.participant_1 = auth.uid() OR chat_rooms.participant_2 = auth.uid())
        )
    )
    WITH CHECK (
        sender_id != auth.uid()
    );

-- =============================================
-- 5. SUPABASE REALTIME
-- =============================================

-- Enable Realtime for chat_messages so clients can subscribe to new messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =============================================
-- 6. RPC: Get unread message count for a user
-- =============================================

CREATE OR REPLACE FUNCTION get_unread_chat_count(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM chat_messages cm
    JOIN chat_rooms cr ON cr.id = cm.room_id
    WHERE cm.is_read = FALSE
    AND cm.sender_id != target_user_id
    AND (cr.participant_1 = target_user_id OR cr.participant_2 = target_user_id);
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
