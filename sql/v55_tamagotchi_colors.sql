-- =====================================================================
-- v55: 다마고치 아바타 커스터마이징 (헬멧/져지/스케이트 끈 색상)
-- =====================================================================
-- 작성일: 2026-05-03
-- 목적:   v54 로 도입된 tamagotchi_pets 에 사용자 커스텀 색상 3개
--         (헬멧/져지/스케이트 끈) 컬럼을 추가하고, 화이트리스트 검증을
--         강제하는 SECURITY DEFINER RPC 를 제공한다.
--
-- 합의된 사양 (사용자 일괄 승인, plan §1):
--   - 팔레트 20색 (헬멧 7 / 져지 8 / 스케이트끈 5)
--   - 기본 색상: 헬멧=#FFFFFF, 져지=#2563EB(powerplay 메인), 스케이트끈=#FFFFFF
--   - 클라이언트는 RPC 만 호출 (직접 UPDATE 금지) → RPC 가 화이트리스트 검증
--   - hex 형식은 추가로 CHECK 제약으로 보강 (DoS/XSS 방어)
--
-- 재실행 안전:
--   - add column if not exists
--   - drop constraint if exists; add constraint ...
--   - create or replace function
--   v54 와 동일한 idempotent 패턴.
--
-- 슬롯:
--   v54 가 마지막 적용 버전. v55 는 다음 빈 슬롯.
--
-- 롤백:
--   sql/rollback_v55_tamagotchi_colors.sql 참조.
-- =====================================================================

-- 1) 컬럼 3개 추가 (default 적용으로 기존 row 도 즉시 채워짐)
alter table tamagotchi_pets
  add column if not exists helmet_color text not null default '#FFFFFF',
  add column if not exists jersey_color text not null default '#2563EB',
  add column if not exists skate_color  text not null default '#FFFFFF';

-- 2) hex 형식 CHECK 제약 (^#[0-9A-Fa-f]{6}$)
--    화이트리스트 외 임의 hex 도 일단 형식만 맞으면 통과하지만,
--    클라이언트는 RPC 만 호출하므로 화이트리스트 검증이 RPC 에서 강제됨.
--    이 CHECK 는 만약 RPC 우회로 직접 UPDATE 가 시도될 경우의 안전망 + 데이터 무결성.
alter table tamagotchi_pets
  drop constraint if exists tamagotchi_pets_helmet_color_format;
alter table tamagotchi_pets
  add  constraint tamagotchi_pets_helmet_color_format
       check (helmet_color ~ '^#[0-9A-Fa-f]{6}$');

alter table tamagotchi_pets
  drop constraint if exists tamagotchi_pets_jersey_color_format;
alter table tamagotchi_pets
  add  constraint tamagotchi_pets_jersey_color_format
       check (jersey_color ~ '^#[0-9A-Fa-f]{6}$');

alter table tamagotchi_pets
  drop constraint if exists tamagotchi_pets_skate_color_format;
alter table tamagotchi_pets
  add  constraint tamagotchi_pets_skate_color_format
       check (skate_color ~ '^#[0-9A-Fa-f]{6}$');

-- 3) SECURITY DEFINER RPC — 화이트리스트 검증 + 본인 row 만 UPDATE
--    auth.uid() = user_id 직접 비교로 RLS 우회 시에도 권한 강제.
--    updated_at 은 v54 의 update_tamagotchi_pets_updated_at 트리거가 자동 갱신.
create or replace function update_tamagotchi_colors(
  p_helmet text,
  p_jersey text,
  p_skate  text
)
returns tamagotchi_pets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  -- 화이트리스트 (plan §1 / 6.5 의 20개 hex 와 정확히 일치)
  v_helmet_allowed text[] := array['#FFFFFF','#1F2937','#DC2626','#2563EB','#1E3A8A','#F59E0B','#9CA3AF'];
  v_jersey_allowed text[] := array['#2563EB','#DC2626','#1F2937','#16A34A','#EA580C','#9333EA','#1E3A8A','#FFFFFF'];
  v_skate_allowed  text[] := array['#FFFFFF','#1F2937','#DC2626','#FACC15','#22C55E'];
  v_row tamagotchi_pets%rowtype;
begin
  if v_user is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- 화이트리스트 검증 (대소문자 무시)
  if upper(p_helmet) <> all (select upper(c) from unnest(v_helmet_allowed) c) then
    raise exception 'invalid helmet color: %', p_helmet using errcode = '22023';
  end if;
  if upper(p_jersey) <> all (select upper(c) from unnest(v_jersey_allowed) c) then
    raise exception 'invalid jersey color: %', p_jersey using errcode = '22023';
  end if;
  if upper(p_skate) <> all (select upper(c) from unnest(v_skate_allowed) c) then
    raise exception 'invalid skate color: %', p_skate using errcode = '22023';
  end if;

  update tamagotchi_pets
    set helmet_color = p_helmet,
        jersey_color = p_jersey,
        skate_color  = p_skate
    where user_id = v_user
    returning * into v_row;

  if not found then
    raise exception 'pet not found' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

-- 4) 권한
revoke all on function update_tamagotchi_colors(text, text, text) from public;
grant execute on function update_tamagotchi_colors(text, text, text) to authenticated;

-- =====================================================================
-- 검증 쿼리 (Supabase SQL Editor 에서 실행 후 결과 확인용)
-- =====================================================================
-- 1) 컬럼 3개 추가 확인
-- select column_name, data_type, column_default, is_nullable
-- from information_schema.columns
-- where table_name = 'tamagotchi_pets'
--   and column_name in ('helmet_color', 'jersey_color', 'skate_color')
-- order by column_name;
--
-- 2) CHECK 제약 3개 확인
-- select conname, pg_get_constraintdef(oid) as def
-- from pg_constraint
-- where conrelid = 'tamagotchi_pets'::regclass
--   and conname like '%color_format'
-- order by conname;
--
-- 3) RPC 존재 + SECURITY DEFINER 확인
-- select proname, prosecdef, pg_get_function_arguments(oid) as args,
--        pg_get_function_result(oid) as returns
-- from pg_proc
-- where proname = 'update_tamagotchi_colors';
--
-- 4) 기존 row default 채워짐 확인
-- select count(*) filter (where helmet_color is null) as null_helmet,
--        count(*) filter (where jersey_color is null) as null_jersey,
--        count(*) filter (where skate_color  is null) as null_skate
-- from tamagotchi_pets;
-- → 모두 0 expected
--
-- 5) 화이트리스트 외 hex 거부 (회원 본인 세션에서)
-- select update_tamagotchi_colors('#000000', '#2563EB', '#FFFFFF');
--   → exception: invalid helmet color: #000000
--
-- 6) 형식 깨진 입력 거부 (RPC 화이트리스트가 먼저 차단)
-- select update_tamagotchi_colors('red', '#2563EB', '#FFFFFF');
--   → exception: invalid helmet color: red
--
-- 7) 정상 호출
-- select update_tamagotchi_colors('#DC2626', '#16A34A', '#FACC15');
--   → row 반환, 본인 펫만 갱신.
