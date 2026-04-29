-- =============================================
-- Rollback for v52_chat_origin_reemit
-- v51 의 create_or_get_chat_room_with_origin 정의로 복원.
--   (새 방 생성 시에만 system 메시지 발화, 기존 방은 system 메시지 발화 X)
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

  IF v_caller < p_target_user_id THEN
    v_p1 := v_caller;
    v_p2 := p_target_user_id;
  ELSE
    v_p1 := p_target_user_id;
    v_p2 := v_caller;
  END IF;

  SELECT id INTO v_existing
  FROM chat_rooms
  WHERE participant1_id = v_p1 AND participant2_id = v_p2;

  IF v_existing IS NOT NULL THEN
    room_id := v_existing;
    was_created := false;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO chat_rooms(participant1_id, participant2_id, origin_type, origin_id)
  VALUES (v_p1, v_p2, p_origin_type, p_origin_id)
  RETURNING id INTO v_new_room;

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
      v_caller,
      '',
      'system',
      v_metadata,
      true
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
