-- Fix ambiguous PL/pgSQL references in club vote RPC

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
