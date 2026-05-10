-- =====================================================================
-- v56: 다마고치 클럽 유니폼 (락인 v2 1단계)
-- =====================================================================
-- 작성일: 2026-05-10
-- 목적:   v54 (다마고치 v1) / v55 (색상) 위에, 사용자가 가입한 클럽의
--         로고를 jersey 위에 오버레이로 표시할 수 있도록
--         tamagotchi_pets 에 uniform_club_id (FK clubs.id) 를 추가하고,
--         가입 검증을 강제하는 SECURITY DEFINER RPC 를 제공한다.
--
-- 합의된 사양 (사용자 일괄 승인, plan §1.2 / §3):
--   - 옷장 모달 상단 토글 (기본 / 클럽 유니폼).
--   - ON 시 jersey 가운데에 클럽 logo_url 오버레이.
--   - 클라이언트는 RPC 만 호출 → RPC 가 가입(club_memberships) 검증.
--   - p_club_id NULL 허용 → 토글 OFF 동작.
--   - 클럽 자체 삭제 시 ON DELETE SET NULL 로 자동 정리.
--   - 멤버십 탈퇴 시 자동 정리 안 함 (1단계 보류, plan §7.5).
--
-- 재실행 안전:
--   - add column if not exists
--   - create index if not exists ... where uniform_club_id is not null
--   - create or replace function
--   v54 / v55 와 동일한 idempotent 패턴.
--
-- 슬롯:
--   v55 가 마지막 적용 버전. v56 이 다음 빈 슬롯.
--
-- 롤백:
--   sql/rollback_v56_tamagotchi_uniform.sql 참조.
-- =====================================================================

-- 1) 컬럼 추가
--    NULL 허용 (= 토글 OFF 상태). FK 는 clubs(id) 로 ON DELETE SET NULL.
--    클럽이 삭제되어도 펫 row 는 남고 uniform 만 자동 해제된다.
alter table tamagotchi_pets
  add column if not exists uniform_club_id uuid
    references clubs(id) on delete set null;

-- 2) 부분 인덱스 (갤러리 / 카운트 쿼리용)
--    uniform_club_id is null 인 row 가 다수이므로 partial index 로 비용 최소화.
create index if not exists idx_tamagotchi_pets_uniform_club_id
  on tamagotchi_pets(uniform_club_id)
  where uniform_club_id is not null;

-- 3) SECURITY DEFINER RPC — 가입(club_memberships) 검증 + 본인 row 만 UPDATE
--    auth.uid() = user_id 직접 비교로 RLS 우회 시에도 권한 강제.
--    updated_at 은 v54 의 update_tamagotchi_pets_updated_at 트리거가 자동 갱신.
--
--    p_club_id 가 NULL 이면 토글 OFF (uniform 해제). 가입 검증 스킵.
--    p_club_id 가 NOT NULL 이면 club_memberships 에 (club_id, user_id) 존재해야 통과.
create or replace function update_tamagotchi_uniform(p_club_id uuid)
returns tamagotchi_pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row  tamagotchi_pets%rowtype;
  v_is_member boolean;
begin
  if v_user is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- p_club_id NOT NULL 인 경우만 멤버십 검증
  if p_club_id is not null then
    select exists (
      select 1 from public.club_memberships
      where club_id = p_club_id and user_id = v_user
    ) into v_is_member;

    if not v_is_member then
      raise exception 'not a member of this club' using errcode = '42501';
    end if;
  end if;

  update tamagotchi_pets
    set uniform_club_id = p_club_id
    where user_id = v_user
    returning * into v_row;

  if not found then
    raise exception 'pet not found' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

-- 4) 권한
revoke all on function update_tamagotchi_uniform(uuid) from public;
grant execute on function update_tamagotchi_uniform(uuid) to authenticated;

-- 5) SECURITY DEFINER RPC — 클럽 갤러리용 (RLS 우회)
--    tamagotchi_pets RLS 가 본인 row 만 SELECT 허용 → 다른 멤버 pet 못 읽음.
--    SECURITY DEFINER 로 우회. 노출 컬럼은 갤러리에 필요한 것만 (helmet/jersey/skate/uniform).
--    가입 멤버 + 다마고치 활성 + 프로필 active(soft delete X) 조건 모두 안에서 강제.
create or replace function get_club_tamagotchi_players(p_club_id uuid)
returns table (
  user_id uuid,
  full_name text,
  joined_at timestamptz,
  helmet_color text,
  jersey_color text,
  skate_color text,
  uniform_club_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    cm.user_id,
    p.full_name,
    cm.created_at,
    tp.helmet_color,
    tp.jersey_color,
    tp.skate_color,
    tp.uniform_club_id
  from club_memberships cm
  inner join profiles p on p.id = cm.user_id
  inner join tamagotchi_pets tp on tp.user_id = cm.user_id
  where cm.club_id = p_club_id
    and p.deleted_at is null
  order by cm.created_at asc
  limit 60;
end;
$$;

revoke all on function get_club_tamagotchi_players(uuid) from public;
grant execute on function get_club_tamagotchi_players(uuid) to authenticated;

-- =====================================================================
-- 검증 쿼리 (Supabase SQL Editor 에서 실행 후 결과 확인용)
-- =====================================================================
-- 1) 컬럼 추가 확인 (data_type=uuid, is_nullable=YES)
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_name = 'tamagotchi_pets'
--   and column_name = 'uniform_club_id';
--
-- 2) FK 제약 + ON DELETE SET NULL 확인
-- select conname, pg_get_constraintdef(oid) as def
-- from pg_constraint
-- where conrelid = 'tamagotchi_pets'::regclass
--   and contype = 'f'
--   and pg_get_constraintdef(oid) ilike '%uniform_club_id%';
--   → ON DELETE SET NULL 포함 expected
--
-- 3) 인덱스 확인 (idx_tamagotchi_pets_uniform_club_id, partial: WHERE uniform_club_id IS NOT NULL)
-- select indexname, indexdef
-- from pg_indexes
-- where tablename = 'tamagotchi_pets'
--   and indexname = 'idx_tamagotchi_pets_uniform_club_id';
--
-- 4) RPC 존재 + SECURITY DEFINER 확인
-- select proname, prosecdef, pg_get_function_arguments(oid) as args,
--        pg_get_function_result(oid) as returns
-- from pg_proc
-- where proname = 'update_tamagotchi_uniform';
--   → prosecdef = true expected
--
-- 5) RPC 호출 (회원 본인 세션):
--    a) 토글 OFF 시뮬레이션
--    select update_tamagotchi_uniform(NULL);
--       → 본인 row 반환, uniform_club_id = NULL
--    b) 가입한 클럽 UUID
--    select update_tamagotchi_uniform('<가입한 club id>'::uuid);
--       → 본인 row 반환, uniform_club_id 갱신됨
--    c) 가입 안 한 클럽 UUID
--    select update_tamagotchi_uniform('<가입 안 한 club id>'::uuid);
--       → exception (errcode 42501): not a member of this club
--    d) 비로그인 (anon key 세션)
--    select update_tamagotchi_uniform(NULL);
--       → exception (errcode 42501): unauthorized
--
-- 6) 클럽 삭제 후 자동 정리 (관리자 시뮬레이션, 운영 DB 에서는 신중)
--    -- 사전: tamagotchi_pets.uniform_club_id = X 인 row 존재
--    delete from clubs where id = X;
--    select count(*) from tamagotchi_pets where uniform_club_id = X;
--       → 0 rows expected (ON DELETE SET NULL 동작 확인)
--
-- 7) 부분 인덱스 사용 확인 (선택)
-- explain select user_id from tamagotchi_pets where uniform_club_id = '<club id>';
--   → Index Scan using idx_tamagotchi_pets_uniform_club_id expected
