-- =====================================================================
-- Rollback: v56_tamagotchi_uniform.sql
-- =====================================================================
-- 작성일: 2026-05-10
--
-- 컨텍스트:
--   v56 은 tamagotchi_pets 에 uniform_club_id 컬럼 + 부분 인덱스 + RPC 1개를
--   추가했다. 롤백은 역순으로 RPC → 인덱스 → 컬럼 순으로 제거.
--
--   주의:
--   - 컬럼 DROP 은 데이터 손실. 롤백 전에 uniform 매핑 데이터 백업 필요 시
--     `select user_id, uniform_club_id from tamagotchi_pets where uniform_club_id is not null;`
--     결과를 보존할 것.
--   - 클라이언트 코드 (useTamagotchi 훅, TamagotchiCloset 등) 가 uniform_club_id /
--     uniformClubId 필드를 참조하는 상태에서 롤백하면 SELECT 컬럼 리스트
--     mismatch 로 런타임 에러. 코드 롤백을 동시 진행할 것.
-- =====================================================================

-- 1) RPC 제거
drop function if exists update_tamagotchi_uniform(uuid);

-- 2) 부분 인덱스 제거 (컬럼 DROP 이 자동으로 인덱스를 제거하지만, 명시적으로 선처리)
drop index if exists idx_tamagotchi_pets_uniform_club_id;

-- 3) 컬럼 제거 (FK 제약은 컬럼 DROP 시 cascade)
alter table tamagotchi_pets
  drop column if exists uniform_club_id;

-- =====================================================================
-- 검증
-- =====================================================================
-- 1) 컬럼 부재 확인
-- select column_name from information_schema.columns
-- where table_name = 'tamagotchi_pets' and column_name = 'uniform_club_id';
--   → 0 rows expected
--
-- 2) 인덱스 부재 확인
-- select indexname from pg_indexes
-- where tablename = 'tamagotchi_pets'
--   and indexname = 'idx_tamagotchi_pets_uniform_club_id';
--   → 0 rows expected
--
-- 3) RPC 부재 확인
-- select proname from pg_proc where proname = 'update_tamagotchi_uniform';
--   → 0 rows expected
