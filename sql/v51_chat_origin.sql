-- =============================================
-- v51_chat_origin (2026-04-29)
-- Chat 기능 확장:
--   1) chat_rooms 에 origin_type / origin_id 정규화 컬럼 추가 (polymorphic, FK 없음)
--   2) chat_messages 에 message_type ('user' | 'system') / metadata(JSONB) 추가
--   3) chat_messages INSERT RLS 강화 — system 메시지 직접 INSERT 금지
--   4) SECURITY DEFINER RPC `create_or_get_chat_room_with_origin`
--      - 자기 자신과 채팅 시도 시 'cannot_chat_with_self' 에러
--      - 정렬된 페어 (participant1 < participant2) 로 기존 방 조회
--      - 새 방 생성 시 origin이 있으면 system 메시지 1회 발화 (is_read=true 로 박음 — 사용자 결정 7-C)
--   5) get_superuser_unread_chat_recipients() 갱신 — message_type='user' 필터로 system 메시지 unread 카운트 제외 (사용자 결정 7-B)
-- =============================================

-- ---------------------------------------------
-- 1) Enums
-- ---------------------------------------------
DO $$ BEGIN
  CREATE TYPE chat_origin_type AS ENUM ('club', 'match');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE chat_message_type AS ENUM ('user', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------
-- 2) chat_rooms 컬럼 추가 (nullable — 기존 row / 전역 셀렉터 호환)
-- ---------------------------------------------
ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS origin_type chat_origin_type,
  ADD COLUMN IF NOT EXISTS origin_id UUID;

COMMENT ON COLUMN chat_rooms.origin_type IS '채팅방 최초 출처 타입 (club, match, ...). 전역 채팅 셀렉터로 시작한 방은 NULL.';
COMMENT ON COLUMN chat_rooms.origin_id IS '출처 엔티티 id. polymorphic 이라 FK 미설정 — 무결성은 RPC 내부 또는 클라이언트에서 검증.';

-- ---------------------------------------------
-- 3) chat_messages 컬럼 추가 (default 'user' — 기존 row 호환)
-- ---------------------------------------------
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_type chat_message_type NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN chat_messages.message_type IS '메시지 타입. user=일반 발화, system=서버가 발화한 안내 (origin 컨텍스트 등).';
COMMENT ON COLUMN chat_messages.metadata IS 'system 메시지 렌더링용 변수. {origin_type, origin_id, ...i18n vars}. PII 금지.';

-- ---------------------------------------------
-- 4) chat_messages INSERT RLS 강화
--    기존: "Users can insert messages in their rooms." (sender + participant 가드)
--    신규: message_type='user' 만 허용 — system 은 SECURITY DEFINER RPC 통해서만
-- ---------------------------------------------
DROP POLICY IF EXISTS "Users can insert messages in their rooms." ON chat_messages;

CREATE POLICY "Users can insert their own user messages in their rooms."
ON chat_messages FOR INSERT
WITH CHECK (
  message_type = 'user'
  AND auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
  )
);

-- ---------------------------------------------
-- 5) SECURITY DEFINER RPC — 채팅방 생성 + 시스템 메시지 1회 발화
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION create_or_get_chat_room_with_origin(
  p_target_user_id UUID,
  p_origin_type chat_origin_type DEFAULT NULL,
  p_origin_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(room_id UUID, was_created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_p1 UUID;
  v_p2 UUID;
  v_existing UUID;
  v_new_room UUID;
  v_metadata JSONB;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_target';
  END IF;

  IF v_caller = p_target_user_id THEN
    RAISE EXCEPTION 'cannot_chat_with_self';
  END IF;

  -- 정렬된 페어 (participant1_id < participant2_id 제약 준수)
  IF v_caller < p_target_user_id THEN
    v_p1 := v_caller;
    v_p2 := p_target_user_id;
  ELSE
    v_p1 := p_target_user_id;
    v_p2 := v_caller;
  END IF;

  -- 기존 방 조회 — 있으면 system 메시지 재발화 없이 그대로 반환 (중복 방지)
  SELECT id INTO v_existing
  FROM chat_rooms
  WHERE participant1_id = v_p1 AND participant2_id = v_p2;

  IF v_existing IS NOT NULL THEN
    room_id := v_existing;
    was_created := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 새 방 생성
  INSERT INTO chat_rooms(participant1_id, participant2_id, origin_type, origin_id)
  VALUES (v_p1, v_p2, p_origin_type, p_origin_id)
  RETURNING id INTO v_new_room;

  -- origin 정보가 있을 때만 시스템 메시지 1회 발화
  IF p_origin_type IS NOT NULL THEN
    v_metadata := jsonb_build_object(
      'origin_type', p_origin_type::text,
      'origin_id', p_origin_id
    ) || COALESCE(p_metadata, '{}'::jsonb);

    INSERT INTO chat_messages(
      room_id,
      sender_id,
      content,
      message_type,
      metadata,
      is_read
    )
    VALUES (
      v_new_room,
      v_caller,           -- 시작한 사람으로 sender 박음. 렌더는 system 스타일.
      '',                 -- 본문은 클라이언트에서 metadata 기반 i18n 렌더
      'system',
      v_metadata,
      true                -- 사용자 결정 7-C: system 은 읽음 처리하여 unread 카운트 제외
    );
  END IF;

  room_id := v_new_room;
  was_created := true;
  RETURN NEXT;
  RETURN;
END;
$$;

COMMENT ON FUNCTION create_or_get_chat_room_with_origin(UUID, chat_origin_type, UUID, JSONB) IS
  '채팅방을 생성하거나 기존 방을 반환. origin 정보가 있고 신규 방일 때만 system 메시지 1회 발화. self-chat 시 cannot_chat_with_self 에러.';

GRANT EXECUTE ON FUNCTION create_or_get_chat_room_with_origin(UUID, chat_origin_type, UUID, JSONB) TO authenticated;

-- ---------------------------------------------
-- 6) Superuser unread chat recipients RPC 갱신
--    system 메시지를 unread 카운트에서 명시적으로 제외 (사용자 결정 7-B)
--    기존 v42 정의를 CREATE OR REPLACE 로 대체.
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
    AND cm.message_type = 'user'   -- system 메시지 제외
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

COMMENT ON FUNCTION get_superuser_unread_chat_recipients IS
  'Superuser-only unread recipient summary. system 메시지는 카운트에서 제외 (v51).';
