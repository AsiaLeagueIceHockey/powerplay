-- =====================================================================
-- v54: 다마고치 픽셀 캐릭터 시스템 (Day-1 출시)
-- =====================================================================
-- 작성일: 2026-05-02
-- 목적:   마이페이지 HERO 영역에 등장하는 픽셀 하키 선수 캐릭터의
--         상태/액션 로그/리마인더 잡 테이블을 운영 DB 에 도입.
--
-- 슬롯 결정:
--   원본은 feature/tamagochi 브랜치의 sql/v50_tamagotchi_v1.sql.
--   main 브랜치에는 이미 v50_email_notifications_schema.sql 이 자리
--   잡고 있어 v50 슬롯 충돌. main 의 마지막 슬롯이 v53 이므로 v54 로
--   리넘버링하여 도입한다 (스키마 내용은 원본 v50 과 동일).
--
-- 클린 슬레이트 전략:
--   운영 DB 에 동일 이름의 빈 테이블 (tamagotchi_pets / _action_logs /
--   _reminder_jobs) 이 이미 존재하지만 데이터가 없고 사용처도 없다고
--   사용자가 확인. 안전을 위해 DROP CASCADE 후 새로 CREATE 한다.
--   참조 무결성 / 정책 / 인덱스 / 트리거 모두 새로 깔리므로 idempotent.
--
-- 재실행 안전:
--   - drop table if exists ... cascade
--   - create table if not exists / create index if not exists 도 함께
--     사용해 두 번째 실행에서도 무해.
--   - drop policy if exists ... ; create policy ...
--   - drop trigger if exists ... ; create trigger ...
--
-- 베이스라인 default:
--   energy=72, condition=76 (코드 lib/tamagotchi-config.ts 의 78 과는
--   별개. 신규 INSERT 는 server action 에서 createDefaultPetSnapshot 으로
--   처리되므로 SQL default 가 직접 사용되는 케이스는 거의 없음.)
-- =====================================================================

-- 0) 기존 빈 테이블 청소 (운영 데이터 없음 확인 완료)
drop table if exists tamagotchi_reminder_jobs cascade;
drop table if exists tamagotchi_action_logs cascade;
drop table if exists tamagotchi_pets cascade;

-- 1) tamagotchi_pets — 사용자별 1:1 펫 상태 스냅샷
create table if not exists tamagotchi_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  nickname text,
  energy integer not null default 72 check (energy between 0 and 100),
  condition integer not null default 76 check (condition between 0 and 100),
  last_decay_at timestamptz not null default now(),
  last_interacted_at timestamptz,
  last_fed_at timestamptz,
  last_trained_at timestamptz,
  last_training_key text,
  pending_special_meal_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tamagotchi_pets_user_id
  on tamagotchi_pets(user_id);

drop trigger if exists update_tamagotchi_pets_updated_at on tamagotchi_pets;
create trigger update_tamagotchi_pets_updated_at
  before update on tamagotchi_pets
  for each row execute function update_updated_at_column();

-- 2) tamagotchi_action_logs — feed/train 액션 일별 idempotency
create table if not exists tamagotchi_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references tamagotchi_pets(id) on delete cascade,
  action_type text not null check (action_type in ('feed', 'train')),
  variant_key text,
  delta_payload jsonb not null default '{}'::jsonb,
  kst_date_key date not null,
  idempotency_key text not null unique,
  performed_at timestamptz not null default now()
);

create index if not exists idx_tamagotchi_action_logs_user_date
  on tamagotchi_action_logs(user_id, kst_date_key desc);

-- 3) tamagotchi_reminder_jobs — 리마인더 큐 (Day-1 cron 미활성화)
create table if not exists tamagotchi_reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id uuid not null references tamagotchi_pets(id) on delete cascade,
  trigger_action_type text not null check (trigger_action_type in ('feed', 'train', 'visit', 'complete')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'failed', 'canceled')),
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tamagotchi_reminder_jobs_due
  on tamagotchi_reminder_jobs(status, scheduled_for asc);

-- 4) RLS 활성화
alter table tamagotchi_pets enable row level security;
alter table tamagotchi_action_logs enable row level security;
alter table tamagotchi_reminder_jobs enable row level security;

-- 5) 정책 — 모든 행은 본인(auth.uid() = user_id) 만 접근.
--    admin/superuser 분기 없음 (Day-1 스코프).

-- 5-1) tamagotchi_pets
drop policy if exists "Users can read own tamagotchi pets" on tamagotchi_pets;
create policy "Users can read own tamagotchi pets"
on tamagotchi_pets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tamagotchi pets" on tamagotchi_pets;
create policy "Users can insert own tamagotchi pets"
on tamagotchi_pets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tamagotchi pets" on tamagotchi_pets;
create policy "Users can update own tamagotchi pets"
on tamagotchi_pets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5-2) tamagotchi_action_logs (DELETE 정책 없음 — 로그는 누적만)
drop policy if exists "Users can read own tamagotchi action logs" on tamagotchi_action_logs;
create policy "Users can read own tamagotchi action logs"
on tamagotchi_action_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tamagotchi action logs" on tamagotchi_action_logs;
create policy "Users can insert own tamagotchi action logs"
on tamagotchi_action_logs
for insert
with check (auth.uid() = user_id);

-- 5-3) tamagotchi_reminder_jobs
drop policy if exists "Users can read own tamagotchi reminder jobs" on tamagotchi_reminder_jobs;
create policy "Users can read own tamagotchi reminder jobs"
on tamagotchi_reminder_jobs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tamagotchi reminder jobs" on tamagotchi_reminder_jobs;
create policy "Users can insert own tamagotchi reminder jobs"
on tamagotchi_reminder_jobs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tamagotchi reminder jobs" on tamagotchi_reminder_jobs;
create policy "Users can update own tamagotchi reminder jobs"
on tamagotchi_reminder_jobs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =====================================================================
-- 검증 쿼리 (Supabase SQL Editor 에서 실행 후 결과 확인용)
-- =====================================================================
-- 1) 빈 테이블 확인 (모두 0 expected)
-- select count(*) from tamagotchi_pets;
-- select count(*) from tamagotchi_action_logs;
-- select count(*) from tamagotchi_reminder_jobs;

-- 2) RLS 정책 9개 (pets 3 + action_logs 2 + reminder_jobs 3 = 8) 확인
--    → action_logs 는 SELECT/INSERT 만 있어 합계 8개가 정상.
-- select tablename, policyname, cmd
-- from pg_policies
-- where tablename like 'tamagotchi_%'
-- order by tablename, policyname;

-- 3) 인덱스 확인 (idx_tamagotchi_pets_user_id, idx_tamagotchi_action_logs_user_date,
--    idx_tamagotchi_reminder_jobs_due 3개)
-- select tablename, indexname
-- from pg_indexes
-- where tablename like 'tamagotchi_%'
-- order by tablename, indexname;

-- 4) RLS 활성화 여부
-- select relname, relrowsecurity
-- from pg_class
-- where relname like 'tamagotchi_%' and relkind = 'r';
