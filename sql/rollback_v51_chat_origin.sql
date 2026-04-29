-- =============================================
-- Rollback for v51_chat_origin
-- 순서: RPC 복원/제거 → 정책 복원 → 컬럼 DROP → 타입 DROP
-- 주의: chat_messages 에 system 메시지 row 가 이미 존재할 수 있다.
--       컬럼 DROP 전에 system row 를 삭제할지(또는 보존할지) 운영 판단 필요.
--       기본은 system row 삭제 후 컬럼 제거.
-- =============================================

-- ---------------------------------------------
-- 1) 신규 RPC 제거
-- ---------------------------------------------
DROP FUNCTION IF EXISTS create_or_get_chat_room_with_origin(UUID, chat_origin_type, UUID, JSONB);

-- ---------------------------------------------
-- 2) get_superuser_unread_chat_recipients() 를 v42 원본으로 복원
--    (message_type 필터 제거)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_superuser_unread_chat_recipients()
RETURNS TABLE (
  room_id uuid,
  recipient_id uuid,
  counterpart_id uuid,
  unread_count bigint,
  latest_unread_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'superuser'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    cm.room_id,
    CASE
      WHEN cm.sender_id = cr.participant1_id THEN cr.participant2_id
      ELSE cr.participant1_id
    END AS recipient_id,
    cm.sender_id AS counterpart_id,
    count(*) AS unread_count,
    max(cm.created_at) AS latest_unread_at
  FROM chat_messages cm
  JOIN chat_rooms cr ON cr.id = cm.room_id
  WHERE cm.is_read = false
  GROUP BY
    cm.room_id,
    CASE
      WHEN cm.sender_id = cr.participant1_id THEN cr.participant2_id
      ELSE cr.participant1_id
    END,
    cm.sender_id
  ORDER BY latest_unread_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_superuser_unread_chat_recipients() TO authenticated;

-- ---------------------------------------------
-- 3) chat_messages INSERT 정책 — v29 원본으로 복원
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own user messages in their rooms." ON chat_messages;

CREATE POLICY "Users can insert messages in their rooms."
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
  )
);

-- ---------------------------------------------
-- 4) v51 에서 발화된 system 메시지 row 정리
--    (컬럼 DROP 전에 안전하게 삭제. 보존하고 싶으면 이 블록을 주석처리)
-- ---------------------------------------------
DELETE FROM chat_messages WHERE message_type = 'system';

-- ---------------------------------------------
-- 5) 컬럼 DROP
-- ---------------------------------------------
ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS message_type;

ALTER TABLE chat_rooms
  DROP COLUMN IF EXISTS origin_id,
  DROP COLUMN IF EXISTS origin_type;

-- ---------------------------------------------
-- 6) 타입 DROP (위 컬럼이 모두 제거되어야 안전)
-- ---------------------------------------------
DROP TYPE IF EXISTS chat_message_type;
DROP TYPE IF EXISTS chat_origin_type;
