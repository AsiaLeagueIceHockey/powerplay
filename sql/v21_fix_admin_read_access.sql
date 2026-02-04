-- v21_fix_admin_read_access.sql
-- 2. Profiles: Allow admins and superusers to select any profile
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

-- 3. Club Memberships: Allow admins and superusers to select any membership
DROP POLICY IF EXISTS "Admins can view all club memberships" ON club_memberships;
CREATE POLICY "Admins can view all club memberships"
    ON club_memberships FOR SELECT
    TO authenticated
    USING (is_admin());
