-- Public club member counts should include:
-- 1) explicit club memberships
-- 2) profiles.primary_club_id declarations
-- Deduplicate the same user within the same club

create or replace function public.get_public_club_member_counts()
returns table (
    club_id uuid,
    member_count bigint
)
language sql
security definer
set search_path = public
as $$
    with combined_members as (
        select
            cm.club_id,
            cm.user_id
        from public.club_memberships as cm

        union

        select
            p.primary_club_id as club_id,
            p.id as user_id
        from public.profiles as p
        where p.primary_club_id is not null
          and p.deleted_at is null
    )
    select
        combined_members.club_id,
        count(*)::bigint as member_count
    from combined_members
    group by combined_members.club_id;
$$;

comment on function public.get_public_club_member_counts() is
    '동호회 멤버십과 프로필 대표 동호회를 합산한 공개 멤버 수를 반환한다.';

revoke all on function public.get_public_club_member_counts() from public;
grant execute on function public.get_public_club_member_counts() to anon, authenticated;
