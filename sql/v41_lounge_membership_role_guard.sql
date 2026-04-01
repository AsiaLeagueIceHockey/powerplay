-- Ensure lounge memberships are assigned only to admin-level accounts.
-- Both admin and superuser roles are valid membership owners.

create or replace function public.ensure_lounge_membership_target_role()
returns trigger
language plpgsql
as $$
declare
  target_role public.user_role;
begin
  select role
    into target_role
  from public.profiles
  where id = new.user_id;

  if target_role is null then
    raise exception 'lounge membership target profile not found: %', new.user_id;
  end if;

  if target_role not in ('admin', 'superuser') then
    raise exception 'lounge memberships can only be assigned to admin or superuser profiles';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_lounge_membership_target_role on public.lounge_memberships;

create trigger trg_lounge_membership_target_role
before insert or update on public.lounge_memberships
for each row
execute function public.ensure_lounge_membership_target_role();
