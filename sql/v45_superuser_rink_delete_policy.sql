-- Restrict rink deletion to superusers only.
-- Deleting a rink clears matches.rink_id and cascades club_rinks rows.

drop policy if exists "Admins can delete rinks" on public.rinks;
drop policy if exists "Superusers can delete rinks" on public.rinks;

create policy "Superusers can delete rinks"
    on public.rinks for delete
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'superuser'
        )
    );
