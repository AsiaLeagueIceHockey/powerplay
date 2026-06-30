-- sql/v51_club_admin_visibility.sql

-- 1. Update RLS policy for clubs UPDATE
-- Allow superuser, creator, OR club_memberships admin to update the club
DROP POLICY IF EXISTS "Admins can update clubs" ON public.clubs;
CREATE POLICY "Admins can update clubs"
    ON public.clubs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM club_memberships
            WHERE club_memberships.club_id = id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role = 'admin'
        )
    );
