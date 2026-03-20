create table if not exists public.lounge_membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'converted', 'closed')),
  note text,
  contact_note text,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lounge_membership_applications_user_created
  on public.lounge_membership_applications(user_id, created_at desc);

create index if not exists idx_lounge_membership_applications_status_created
  on public.lounge_membership_applications(status, created_at desc);

create unique index if not exists idx_lounge_membership_applications_pending_unique
  on public.lounge_membership_applications(user_id)
  where status in ('pending', 'contacted');

alter table public.lounge_membership_applications enable row level security;

drop policy if exists "Users can view own lounge applications" on public.lounge_membership_applications;
create policy "Users can view own lounge applications"
  on public.lounge_membership_applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own lounge applications" on public.lounge_membership_applications;
create policy "Users can insert own lounge applications"
  on public.lounge_membership_applications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Superusers can view lounge applications" on public.lounge_membership_applications;
create policy "Superusers can view lounge applications"
  on public.lounge_membership_applications for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superuser'
    )
  );

drop policy if exists "Superusers can update lounge applications" on public.lounge_membership_applications;
create policy "Superusers can update lounge applications"
  on public.lounge_membership_applications for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superuser'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'superuser'
    )
  );
