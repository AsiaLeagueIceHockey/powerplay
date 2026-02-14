-- =============================================
-- 정규 멤버 관리 기능 스키마 변경 (2026-02-14)
-- =============================================

-- =============================================
-- 1. club_memberships 테이블 확장
-- =============================================

-- 가입 승인 상태 (기존 멤버는 자동 approved)
ALTER TABLE club_memberships 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 가입 신청 자기소개
ALTER TABLE club_memberships 
ADD COLUMN IF NOT EXISTS intro_message TEXT;

COMMENT ON COLUMN club_memberships.status IS '가입 상태: pending(대기), approved(승인), rejected(거부)';
COMMENT ON COLUMN club_memberships.intro_message IS '가입 신청 시 자기소개 메시지';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_club_memberships_status ON club_memberships(status);

-- =============================================
-- 2. matches 테이블 확장
-- =============================================

-- 경기 타입: 오픈하키 vs 정규대관
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'open_hockey' 
  CHECK (match_type IN ('open_hockey', 'regular'));

-- 게스트 모집 허용 시간 (경기 시작 X시간 전부터)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS guest_open_hours_before INTEGER DEFAULT 24;

COMMENT ON COLUMN matches.match_type IS '경기 타입: open_hockey(오픈하키), regular(정규대관)';
COMMENT ON COLUMN matches.guest_open_hours_before IS '게스트 모집 허용 시간 (경기 시작 X시간 전부터)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);

-- =============================================
-- 3. regular_match_responses 테이블 (신규)
-- =============================================

CREATE TABLE IF NOT EXISTS regular_match_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('attending', 'not_attending')),
    position position_type,  -- 참석 시 포지션 선택
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

COMMENT ON TABLE regular_match_responses IS '정규대관 경기에 대한 정규멤버 참/불참 응답';
COMMENT ON COLUMN regular_match_responses.response IS '응답: attending(참석), not_attending(불참)';
COMMENT ON COLUMN regular_match_responses.position IS '참석 시 희망 포지션';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_regular_match_responses_match_id ON regular_match_responses(match_id);
CREATE INDEX IF NOT EXISTS idx_regular_match_responses_user_id ON regular_match_responses(user_id);

-- updated_at 트리거
CREATE TRIGGER update_regular_match_responses_updated_at
    BEFORE UPDATE ON regular_match_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. RLS 정책 - regular_match_responses
-- =============================================

ALTER TABLE regular_match_responses ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 읽을 수 있음 (관리자가 현황 확인 가능)
CREATE POLICY "Regular match responses are readable by authenticated users"
    ON regular_match_responses FOR SELECT
    TO authenticated
    USING (true);

-- 본인만 자기 응답 생성 가능
CREATE POLICY "Users can insert own response"
    ON regular_match_responses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 본인만 자기 응답 수정 가능
CREATE POLICY "Users can update own response"
    ON regular_match_responses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 관리자도 응답 조회/관리 가능
CREATE POLICY "Admins can manage regular match responses"
    ON regular_match_responses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- =============================================
-- 5. RPC: 동호회 멤버 Push Token 조회
-- (SECURITY DEFINER로 RLS 우회)
-- =============================================

CREATE OR REPLACE FUNCTION get_club_member_push_tokens(target_club_id UUID)
RETURNS TABLE (
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    INNER JOIN club_memberships cm ON cm.user_id = ps.user_id
    WHERE cm.club_id = target_club_id
      AND cm.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. RPC: 동호회 관리자(creator) Push Token 조회
-- =============================================

CREATE OR REPLACE FUNCTION get_club_admin_push_tokens(target_club_id UUID)
RETURNS TABLE (
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    INNER JOIN clubs c ON c.created_by = ps.user_id
    WHERE c.id = target_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
