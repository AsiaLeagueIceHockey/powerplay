-- =============================================
-- v53_chat_origin_reemit_fix (2026-04-30)
-- v52 의 create_or_get_chat_room_with_origin 버그 수정.
--
-- 버그: dedup 검사 SELECT 의 `WHERE room_id = v_room` 가
--       OUT 파라미터(`RETURNS TABLE(room_id UUID, ...)`)와
--       chat_messages.room_id 컬럼 사이의 이름 충돌로 PL/pgSQL 이
--       "column reference is ambiguous" 에러를 던졌음.
--       → 기존 방 재진입 시 RPC 실패 → 클라이언트가 unknown 코드로
--          매핑 → "채팅방을 열 수 없습니다" alert 노출.
--
-- 수정:
--   1) chat_messages 에 alias `cm` 부여하고 모든 컬럼 참조를 qualify.
--   2) 함수 상단에 `#variable_conflict use_column` 디렉티브 추가 —
--      앞으로의 모호 참조도 컬럼 우선으로 해석하도록 강제.
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
#variable_conflict use_column
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

  -- 정렬된 페어 (participant1_id < participant2_id 제약 준수)
  IF v_caller < p_target_user_id THEN
    v_p1 := v_caller;
    v_p2 := p_target_user_id;
  ELSE
    v_p1 := p_target_user_id;
    v_p2 := v_caller;
  END IF;

  -- 기존 방 조회
  SELECT cr.id INTO v_existing
  FROM chat_rooms cr
  WHERE cr.participant1_id = v_p1 AND cr.participant2_id = v_p2;

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
    -- 기존 방인 경우에만 dedup 검사. cm alias 로 OUT 파라미터(room_id)
    -- 와의 이름 충돌 회피.
    SELECT
      cm.message_type,
      cm.metadata->>'origin_type',
      cm.metadata->>'origin_id'
    INTO
      v_last_msg_type,
      v_last_origin_type,
      v_last_origin_id_text
    FROM chat_messages cm
    WHERE cm.room_id = v_room
    ORDER BY cm.created_at DESC
    LIMIT 1;

    IF v_last_msg_type = 'system'::chat_message_type
       AND v_last_origin_type = p_origin_type::text
       AND v_last_origin_id_text IS NOT DISTINCT FROM p_origin_id::text THEN
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
      'system'::chat_message_type,
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
  'v53: 채팅방 생성 또는 기존 방 반환. origin 정보가 있으면 매번 system 메시지 발화 — 단, 직전 메시지가 동일 origin 의 system 메시지면 dedup 으로 건너뜀. self-chat 시 cannot_chat_with_self 에러. v52 의 OUT 파라미터/컬럼 이름 충돌 버그 수정.';
