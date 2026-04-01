-- =============================================
-- Add Chat Feature schema (2026-02-22)
-- =============================================

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id),
    CHECK (participant1_id < participant2_id) -- Ensures (A, B) is treated same as (B, A) via alphabetical ordering
);

COMMENT ON TABLE chat_rooms IS 'Stores 1:1 chat rooms between two users.';
COMMENT ON COLUMN chat_rooms.participant1_id IS 'One of the participants. Enforced to be alphabetically/lexicographically smaller than participant2_id to prevent duplicates.';

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Stores individual messages within a chat room.';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the receiver has read the message.';

-- Trigger to update chat_rooms.updated_at
CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET updated_at = NOW()
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_chat_rooms_updated_at
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_rooms_updated_at();

-- RLS Policies for chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat rooms."
ON chat_rooms FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create chat rooms if they are a participant."
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their own chat rooms."
ON chat_rooms FOR UPDATE
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms."
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = chat_messages.room_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

CREATE POLICY "Users can insert messages in their rooms."
ON chat_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = room_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

CREATE POLICY "Users can update (mark as read) messages in their rooms."
ON chat_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE id = chat_messages.room_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
