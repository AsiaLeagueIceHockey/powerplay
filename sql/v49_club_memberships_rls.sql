-- v49_club_memberships_rls.sql

-- 1. Superusers can do everything
CREATE POLICY "Superusers can update club memberships"
    ON club_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

CREATE POLICY "Superusers can delete club memberships"
    ON club_memberships FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

-- 2. Club Admins can manage their club's memberships
CREATE POLICY "Club admins can update club memberships"
    ON club_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM club_memberships AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.club_id = club_memberships.club_id
            AND my_membership.role = 'admin'
        )
    );

CREATE POLICY "Club admins can delete club memberships"
    ON club_memberships FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM club_memberships AS my_membership
            WHERE my_membership.user_id = auth.uid()
            AND my_membership.club_id = club_memberships.club_id
            AND my_membership.role = 'admin'
        )
    );
