-- =============================================
-- Rollback for v53_chat_origin_reemit_fix
-- v52 정의(버그 있는 버전)로 복원.
-- 운영상 v51 까지 되돌리고 싶으면 rollback_v52 도 실행할 것.
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
    v_room := v_existing;
    v_was_created := false;
  ELSE
    INSERT INTO chat_rooms(participant1_id, participant2_id, origin_type, origin_id)
    VALUES (v_p1, v_p2, p_origin_type, p_origin_id)
    RETURNING id INTO v_new_room;
    v_room := v_new_room;
    v_was_created := true;
  END IF;

  v_should_emit := p_origin_type IS NOT NULL;

  IF v_should_emit AND NOT v_was_created THEN
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
