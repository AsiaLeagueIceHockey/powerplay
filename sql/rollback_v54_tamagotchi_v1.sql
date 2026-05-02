-- =====================================================================
-- Rollback: v54_tamagotchi_v1.sql
-- =====================================================================
-- 작성일: 2026-05-02
--
-- 컨텍스트:
--   v54 적용 시점에 운영 DB 에 데이터가 없었음 (사용자 확인 완료).
--   따라서 롤백은 단순 DROP CASCADE 로 충분하며 데이터 보존 부담 없음.
--   외래키 의존 순서대로 reminder_jobs → action_logs → pets 순으로 삭제.
-- =====================================================================

drop table if exists tamagotchi_reminder_jobs cascade;
drop table if exists tamagotchi_action_logs cascade;
drop table if exists tamagotchi_pets cascade;

-- 검증
-- select tablename from pg_tables where tablename like 'tamagotchi_%';
-- → 0 rows expected
