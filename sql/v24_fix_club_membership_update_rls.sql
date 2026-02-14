-- =============================================
-- v24: club_memberships UPDATE RLS 정책 추가
-- 기존에 UPDATE 정책이 없어 관리자 승인/거부가 불가능했음
-- =============================================

-- 1. 동호회 생성자(creator)가 멤버십 상태를 변경할 수 있는 정책
DROP POLICY IF EXISTS "Club creators can update memberships" ON club_memberships;
CREATE POLICY "Club creators can update memberships"
    ON club_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_memberships.club_id
            AND clubs.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_memberships.club_id
            AND clubs.created_by = auth.uid()
        )
    );

-- 2. 시스템 관리자/슈퍼유저도 멤버십 상태를 변경할 수 있는 정책
DROP POLICY IF EXISTS "Admins can update club memberships" ON club_memberships;
CREATE POLICY "Admins can update club memberships"
    ON club_memberships FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 3. 본인이 자기 멤버십을 수정할 수 있는 정책 (재신청 등)
DROP POLICY IF EXISTS "Users can update own membership" ON club_memberships;
CREATE POLICY "Users can update own membership"
    ON club_memberships FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
