-- =============================================
-- Superuser chat monitoring RPCs
-- Returns chat room metadata and unread recipient summaries
-- without exposing chat message contents.
-- =============================================

create or replace function get_superuser_chat_room_overview()
returns table (
  room_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  participant1_id uuid,
  participant2_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'superuser'
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  select
    cr.id as room_id,
    cr.created_at,
    cr.updated_at,
    cr.participant1_id,
    cr.participant2_id
  from chat_rooms cr
  order by cr.updated_at desc;
end;
$$;

grant execute on function get_superuser_chat_room_overview() to authenticated;

comment on function get_superuser_chat_room_overview is
  'Superuser-only chat room metadata overview without message content.';

create or replace function get_superuser_unread_chat_recipients()
returns table (
  room_id uuid,
  recipient_id uuid,
  counterpart_id uuid,
  unread_count bigint,
  latest_unread_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'superuser'
  ) then
    raise exception 'unauthorized';
  end if;

  return query
  select
    cm.room_id,
    case
      when cm.sender_id = cr.participant1_id then cr.participant2_id
      else cr.participant1_id
    end as recipient_id,
    cm.sender_id as counterpart_id,
    count(*) as unread_count,
    max(cm.created_at) as latest_unread_at
  from chat_messages cm
  join chat_rooms cr on cr.id = cm.room_id
  where cm.is_read = false
  group by
    cm.room_id,
    case
      when cm.sender_id = cr.participant1_id then cr.participant2_id
      else cr.participant1_id
    end,
    cm.sender_id
  order by latest_unread_at desc;
end;
$$;

grant execute on function get_superuser_unread_chat_recipients() to authenticated;

comment on function get_superuser_unread_chat_recipients is
  'Superuser-only unread recipient summary for manual follow-up.';
