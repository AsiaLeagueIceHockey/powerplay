-- =====================================================================
-- Rollback: v55_tamagotchi_colors.sql
-- =====================================================================
-- 작성일: 2026-05-03
--
-- 컨텍스트:
--   v55 는 tamagotchi_pets 에 색상 컬럼 3개 + CHECK 제약 3개 + RPC 1개를
--   추가했다. 롤백은 역순으로 RPC → 제약 → 컬럼 순으로 제거.
--
--   주의:
--   - 컬럼 DROP 은 데이터 손실. 롤백 전에 색상 데이터 백업 필요 시
--     `select user_id, helmet_color, jersey_color, skate_color from tamagotchi_pets;`
--     결과를 보존할 것.
--   - 클라이언트 코드(useTamagotchi 훅 등)가 colors 필드를 참조하는 상태에서
--     롤백하면 SELECT 컬럼 리스트 mismatch 로 런타임 에러. 코드 롤백을 동시 진행.
-- =====================================================================

-- 1) RPC 제거
drop function if exists update_tamagotchi_colors(text, text, text);

-- 2) CHECK 제약 제거
alter table tamagotchi_pets
  drop constraint if exists tamagotchi_pets_helmet_color_format,
  drop constraint if exists tamagotchi_pets_jersey_color_format,
  drop constraint if exists tamagotchi_pets_skate_color_format;

-- 3) 컬럼 제거
alter table tamagotchi_pets
  drop column if exists helmet_color,
  drop column if exists jersey_color,
  drop column if exists skate_color;

-- =====================================================================
-- 검증
-- =====================================================================
-- 1) 컬럼 3개 부재 확인
-- select column_name from information_schema.columns
-- where table_name = 'tamagotchi_pets'
--   and column_name in ('helmet_color', 'jersey_color', 'skate_color');
--   → 0 rows expected
--
-- 2) CHECK 제약 부재 확인
-- select conname from pg_constraint
-- where conrelid = 'tamagotchi_pets'::regclass and conname like '%color_format';
--   → 0 rows expected
--
-- 3) RPC 부재 확인
-- select proname from pg_proc where proname = 'update_tamagotchi_colors';
--   → 0 rows expected
