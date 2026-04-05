-- Track how a club membership was created so we can safely sync
-- profiles.primary_club_id <-> club_memberships without inflating counts.

alter table public.club_memberships
add column if not exists source text;

update public.club_memberships
set source = 'legacy_join'
where source is null;

update public.club_memberships as cm
set source = 'club_create'
from public.clubs as c
where cm.club_id = c.id
  and cm.user_id = c.created_by
  and cm.role = 'admin'
  and cm.source = 'legacy_join';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'club_memberships_source_check'
  ) then
    alter table public.club_memberships
      add constraint club_memberships_source_check
      check (source in ('legacy_join', 'club_create', 'manual_subscribe', 'primary_club'));
  end if;
end $$;

alter table public.club_memberships
alter column source set default 'legacy_join';

alter table public.club_memberships
alter column source set not null;

comment on column public.club_memberships.source is
  'Membership source: legacy_join, club_create, manual_subscribe, primary_club';

insert into public.club_memberships (club_id, user_id, role, source)
select
  p.primary_club_id,
  p.id,
  'member'::public.club_role,
  'primary_club'
from public.profiles as p
where p.primary_club_id is not null
  and p.deleted_at is null
  and not exists (
    select 1
    from public.club_memberships as cm
    where cm.club_id = p.primary_club_id
      and cm.user_id = p.id
  );
