-- =============================================
-- v22_superuser_matches_fix.sql
-- Force SuperUser RLS for matches update
-- =============================================


-- 2. Fix Matches Update Policy
DROP POLICY IF EXISTS "Admins can update matches" ON matches;
CREATE POLICY "Admins can update matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (is_admin());

-- 3. Fix Matches Delete Policy (Safe measure)
DROP POLICY IF EXISTS "Admins can delete matches" ON matches;
CREATE POLICY "Admins can delete matches"
    ON matches FOR DELETE
    TO authenticated
    USING (is_admin());

-- 4. Fix Matches Insert Policy
DROP POLICY IF EXISTS "Admins can insert matches" ON matches;
CREATE POLICY "Admins can insert matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());
