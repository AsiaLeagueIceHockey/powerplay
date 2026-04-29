-- =============================================
-- v52_chat_origin_reemit (2026-04-30)
-- create_or_get_chat_room_with_origin 동작 변경:
--   - v51 까지: 새 방 생성 시에만 origin system 메시지 1회 발화
--   - v52 부터: 기존 방 재진입 시에도 origin 정보가 있으면 system 메시지 발화
--     (예: 동호회 페이지 → "동호회 채팅하기" 클릭 시 매번 컨텍스트 표시)
--
-- Dedup: 마지막 메시지가 이미 동일한 origin_type + origin_id 의 system 메시지인
--        경우에는 발화를 건너뛴다 (rapid double-click 방어). 일반 메시지가
--        하나라도 끼어 있으면 새 origin 컨텍스트로 인정해서 발화.
--
-- 반환 shape (room_id, was_created) 는 그대로 — 클라이언트 변경 불필요.
-- =============================================

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
  v_room UUID;
  v_was_created BOOLEAN;
  v_metadata JSONB;
  v_last_msg_type chat_message_type;
  v_last_origin_type TEXT;
  v_last_origin_id_text TEXT;
  v_should_emit BOOLEAN;
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

  -- 정렬된 페어
  IF v_caller < p_target_user_id THEN
    v_p1 := v_caller;
    v_p2 := p_target_user_id;
  ELSE
    v_p1 := p_target_user_id;
    v_p2 := v_caller;
  END IF;

  -- 기존 방 조회
  SELECT id INTO v_existing
  FROM chat_rooms
  WHERE participant1_id = v_p1 AND participant2_id = v_p2;

  IF v_existing IS NOT NULL THEN
    v_room := v_existing;
    v_was_created := false;
  ELSE
    INSERT INTO chat_rooms(participant1_id, participant2_id, origin_type, origin_id)
    VALUES (v_p1, v_p2, p_origin_type, p_origin_id)
    RETURNING id INTO v_new_room;
    v_room := v_new_room;
    v_was_created := true;
  END IF;

  -- 발화 여부 판단
  v_should_emit := p_origin_type IS NOT NULL;

  IF v_should_emit AND NOT v_was_created THEN
    -- 기존 방인 경우에만 dedup 검사 (새 방은 메시지 자체가 없음)
    SELECT
      message_type,
      metadata->>'origin_type',
      metadata->>'origin_id'
    INTO
      v_last_msg_type,
      v_last_origin_type,
      v_last_origin_id_text
    FROM chat_messages
    WHERE room_id = v_room
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_msg_type = 'system'
       AND v_last_origin_type = p_origin_type::text
       AND v_last_origin_id_text IS NOT DISTINCT FROM p_origin_id::text THEN
      -- 마지막 메시지가 같은 origin 의 system 메시지 → 중복 발화 방지
      v_should_emit := false;
    END IF;
  END IF;

  IF v_should_emit THEN
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
      v_room,
      v_caller,
      '',
      'system',
      v_metadata,
      true
    );
  END IF;

  room_id := v_room;
  was_created := v_was_created;
  RETURN NEXT;
  RETURN;
END;
$$;

COMMENT ON FUNCTION create_or_get_chat_room_with_origin(UUID, chat_origin_type, UUID, JSONB) IS
  'v52: 채팅방 생성 또는 기존 방 반환. origin 정보가 있으면 매번 system 메시지 발화 — 단, 직전 메시지가 동일 origin 의 system 메시지면 dedup 으로 건너뜀. self-chat 시 cannot_chat_with_self 에러.';
