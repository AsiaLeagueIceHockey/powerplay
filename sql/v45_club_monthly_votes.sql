-- Monthly club voting / ranking
-- Users can cast up to 3 votes per KST day
-- The same user can only vote for the same club once per KST day
-- Rankings reset automatically each month by querying the current KST month

create table if not exists public.club_votes (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    vote_date_kst date not null,
    vote_month_kst text not null,
    created_at timestamptz not null default now()
);

comment on table public.club_votes is '동호회 월간 랭킹용 응원 투표';
comment on column public.club_votes.vote_date_kst is '투표한 KST 날짜';
comment on column public.club_votes.vote_month_kst is '투표한 KST 월(YYYY-MM)';

create unique index if not exists uq_club_votes_user_club_daily
    on public.club_votes(club_id, user_id, vote_date_kst);

create index if not exists idx_club_votes_monthly_ranking
    on public.club_votes(vote_month_kst, club_id, created_at desc);

create index if not exists idx_club_votes_user_daily
    on public.club_votes(user_id, vote_date_kst desc, created_at desc);

alter table public.club_votes enable row level security;

drop policy if exists "Users can view their own club votes" on public.club_votes;
create policy "Users can view their own club votes"
    on public.club_votes for select
    to authenticated
    using (auth.uid() = user_id);

create or replace function public.get_public_club_vote_totals(target_month_kst text default null)
returns table (
    club_id uuid,
    vote_count bigint
)
language sql
security definer
set search_path = public
as $$
    select
        club_votes.club_id,
        count(*)::bigint as vote_count
    from public.club_votes
    where club_votes.vote_month_kst = coalesce(
        target_month_kst,
        to_char(timezone('Asia/Seoul', now()), 'YYYY-MM')
    )
    group by club_votes.club_id;
$$;

comment on function public.get_public_club_vote_totals(text) is
    '현재 KST 월 기준 동호회별 응원 투표 수를 공개 집계한다.';

create or replace function public.cast_club_vote(target_club_id uuid)
returns table (
    vote_id uuid,
    vote_date_kst date,
    vote_month_kst text,
    remaining_daily_votes integer,
    monthly_vote_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    current_vote_date_kst date := timezone('Asia/Seoul', now())::date;
    current_vote_month_kst text := to_char(timezone('Asia/Seoul', now()), 'YYYY-MM');
    today_vote_count integer := 0;
    inserted_vote_id uuid;
begin
    if current_user_id is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if target_club_id is null then
        raise exception 'CLUB_REQUIRED';
    end if;

    if not exists (
        select 1
        from public.clubs as c
        where c.id = target_club_id
    ) then
        raise exception 'CLUB_NOT_FOUND';
    end if;

    select count(*)::integer
    into today_vote_count
    from public.club_votes as cv
    where cv.user_id = current_user_id
      and cv.vote_date_kst = current_vote_date_kst;

    if today_vote_count >= 3 then
        raise exception 'DAILY_LIMIT_REACHED';
    end if;

    if exists (
        select 1
        from public.club_votes as cv
        where cv.user_id = current_user_id
          and cv.club_id = target_club_id
          and cv.vote_date_kst = current_vote_date_kst
    ) then
        raise exception 'ALREADY_VOTED_TODAY';
    end if;

    insert into public.club_votes (
        club_id,
        user_id,
        vote_date_kst,
        vote_month_kst
    )
    values (
        target_club_id,
        current_user_id,
        current_vote_date_kst,
        current_vote_month_kst
    )
    returning id into inserted_vote_id;

    return query
    select
        inserted_vote_id,
        current_vote_date_kst,
        current_vote_month_kst,
        greatest(0, 3 - (today_vote_count + 1)) as remaining_daily_votes,
        (
            select count(*)::bigint
            from public.club_votes as cv
            where cv.club_id = target_club_id
              and cv.vote_month_kst = current_vote_month_kst
        ) as monthly_vote_count;
end;
$$;

comment on function public.cast_club_vote(uuid) is
    '인증 사용자의 동호회 응원 투표를 기록하고 KST 일일 제한을 강제한다.';

revoke all on function public.get_public_club_vote_totals(text) from public;
grant execute on function public.get_public_club_vote_totals(text) to anon, authenticated;

revoke all on function public.cast_club_vote(uuid) from public;
grant execute on function public.cast_club_vote(uuid) to authenticated;
