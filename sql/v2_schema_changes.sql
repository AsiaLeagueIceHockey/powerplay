-- Add new columns to rinks table
ALTER TABLE rinks 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS rink_type TEXT CHECK (rink_type IN ('FULL', 'MINI')),
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

COMMENT ON COLUMN rinks.address IS 'Full address of the rink';
COMMENT ON COLUMN rinks.rink_type IS 'Type of rink: FULL (Standard) or MINI';
COMMENT ON COLUMN rinks.lat IS 'Latitude for map marker';
COMMENT ON COLUMN rinks.lng IS 'Longitude for map marker';

-- =============================================
-- 동호회 시스템 스키마 변경 (2026-01-13)
-- =============================================

-- 1. 동호회 역할 ENUM
CREATE TYPE club_role AS ENUM ('admin', 'member');

-- 2. 참가자 타입 ENUM
CREATE TYPE participant_type AS ENUM ('member', 'guest');

-- 3. 동호회 테이블
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                           -- 동호회명 (e.g. "하키러브")
    kakao_open_chat_url TEXT,                     -- 카카오톡 오픈채팅 링크 (optional)
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clubs IS '아이스하키 동호회';
COMMENT ON COLUMN clubs.name IS '동호회명';
COMMENT ON COLUMN clubs.kakao_open_chat_url IS '카카오톡 오픈채팅 링크';

-- 4. 동호회 멤버십 테이블
CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role club_role DEFAULT 'member',              -- 동호회 내 역할 (admin/member)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, user_id)                      -- 중복 가입 방지
);

COMMENT ON TABLE club_memberships IS '동호회 멤버십 (다대다 관계)';
COMMENT ON COLUMN club_memberships.role IS 'admin: 동호회 운영자, member: 일반 멤버';

-- 5. matches 테이블에 club_id 추가
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

COMMENT ON COLUMN matches.club_id IS '주최 동호회 (NULL이면 개인 주최)';

-- 6. participants 테이블에 participant_type 추가
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS participant_type participant_type DEFAULT 'guest';

COMMENT ON COLUMN participants.participant_type IS 'member: 동호회 멤버로 참가, guest: 게스트로 참가';

-- 7. profiles 테이블에 onboarding_completed 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.onboarding_completed IS '온보딩 완료 여부';

-- 8. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_club_id ON matches(club_id);

-- 9. RLS 정책 - Clubs
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs are publicly readable"
    ON clubs FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Admins can insert clubs"
    ON clubs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update clubs"
    ON clubs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 10. RLS 정책 - Club Memberships
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club memberships are publicly readable"
    ON club_memberships FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Users can join clubs"
    ON club_memberships FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs"
    ON club_memberships FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 11. updated_at 트리거 for clubs
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
