create table if not exists daily_hockey_fortunes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  fortune_date date not null,
  score integer not null check (score between 80 and 100),
  title_ko text not null,
  title_en text not null,
  summary_ko text not null,
  summary_en text not null,
  details_ko text[] not null default '{}',
  details_en text[] not null default '{}',
  dominant_theme text not null,
  caution_theme text not null,
  energy_level integer not null default 0 check (energy_level between -5 and 5),
  signals jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, fortune_date)
);

create index if not exists idx_daily_hockey_fortunes_user_date
  on daily_hockey_fortunes(user_id, fortune_date desc);

alter table daily_hockey_fortunes enable row level security;

create policy "Users can read own daily hockey fortunes"
on daily_hockey_fortunes
for select
using (auth.uid() = user_id);

create policy "Users can insert own daily hockey fortunes"
on daily_hockey_fortunes
for insert
with check (auth.uid() = user_id);

create policy "Users can update own daily hockey fortunes"
on daily_hockey_fortunes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
