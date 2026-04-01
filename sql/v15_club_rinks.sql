-- Create club_rinks junction table for Many-to-Many relationship
create table if not exists club_rinks (
  club_id uuid references clubs(id) on delete cascade not null,
  rink_id uuid references rinks(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (club_id, rink_id)
);

-- Enable RLS
alter table club_rinks enable row level security;

-- Policies

-- Public Read
create policy "Public can view club_rinks"
  on club_rinks for select
  using (true);

-- Admin/Superuser Write (Insert)
create policy "Admins can insert club_rinks"
  on club_rinks for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'superuser')
    )
  );

-- Admin/Superuser Write (Delete)
create policy "Admins can delete club_rinks"
  on club_rinks for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'superuser')
    )
  );

-- Helper function to update club rinks (optional optimization, but we can do it in app logic for now)
