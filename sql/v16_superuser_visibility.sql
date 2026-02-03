-- =============================================
-- SuperUser Visibility Fix (2026-02-03)
-- =============================================

-- Ensure SuperUsers can view all club memberships
-- (In case "Publicly readable" policy was restricting something or removed)
DROP POLICY IF EXISTS "Superusers can view all club memberships" ON club_memberships;

CREATE POLICY "Superusers can view all club memberships"
    ON club_memberships FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

-- Also ensure SuperUsers can view all clubs (redundant if public, but safe)
DROP POLICY IF EXISTS "Superusers can view all clubs" ON clubs;

CREATE POLICY "Superusers can view all clubs"
    ON clubs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );
