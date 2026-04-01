-- Restrict club deletion to superusers only.
-- Club removal cascades memberships/posts/rink links and nulls linked matches/profile references.

drop policy if exists "Admins can delete clubs" on public.clubs;
drop policy if exists "Superusers can delete clubs" on public.clubs;

create policy "Superusers can delete clubs"
    on public.clubs for delete
    to authenticated
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'superuser'
        )
    );
