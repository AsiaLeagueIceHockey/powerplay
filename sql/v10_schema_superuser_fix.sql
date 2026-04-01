-- =============================================
-- 🏒 Power Play - SuperUser RLS 권한 수정
-- schema_superuser_fix.sql
-- 
-- superuser가 admin과 동일한 권한을 갖도록 
-- 기존 RLS 정책들을 수정합니다.
-- =============================================

-- =============================================
-- 1. matches 테이블 - superuser 권한 추가
-- =============================================

DROP POLICY IF EXISTS "Admins can insert matches" ON matches;
CREATE POLICY "Admins can insert matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can update matches" ON matches;
CREATE POLICY "Admins can update matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can delete matches" ON matches;
CREATE POLICY "Admins can delete matches"
    ON matches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 2. rinks 테이블 - superuser 권한 추가
-- =============================================

DROP POLICY IF EXISTS "Admins can insert rinks" ON rinks;
CREATE POLICY "Admins can insert rinks"
    ON rinks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can update rinks" ON rinks;
CREATE POLICY "Admins can update rinks"
    ON rinks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can delete rinks" ON rinks;
CREATE POLICY "Admins can delete rinks"
    ON rinks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 3. profiles 테이블 - superuser 권한 추가
-- =============================================

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 4. participants 테이블 - superuser 권한 추가
-- =============================================

DROP POLICY IF EXISTS "Admins can update any participation" ON participants;
CREATE POLICY "Admins can update any participation"
    ON participants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can delete any participation" ON participants;
CREATE POLICY "Admins can delete any participation"
    ON participants FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 5. clubs 테이블 - superuser 권한 추가 (있는 경우)
-- =============================================

DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
CREATE POLICY "Admins can insert clubs"
    ON clubs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
CREATE POLICY "Admins can update clubs"
    ON clubs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;
CREATE POLICY "Admins can delete clubs"
    ON clubs FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 6. is_admin 함수 업데이트 - superuser 포함
-- =============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'superuser')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
