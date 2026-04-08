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

alter table tamagotchi_pets enable row level security;
alter table tamagotchi_action_logs enable row level security;
alter table tamagotchi_reminder_jobs enable row level security;

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
