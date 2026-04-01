-- 1. Add description to clubs
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN clubs.description IS '동호회 설명 (소개글)';

-- 2. Club Notices (Posts)
CREATE TABLE IF NOT EXISTS club_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE club_posts IS '동호회 공지사항 (게시글)';

-- 3. RLS for club_posts
ALTER TABLE club_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read posts
CREATE POLICY "Club posts are publicly readable"
    ON club_posts FOR SELECT
    TO authenticated, anon
    USING (true);

-- Admins can manage all posts
CREATE POLICY "Admins can manage club posts"
    ON club_posts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 4. Trigger for updated_at
CREATE TRIGGER update_club_posts_updated_at
    BEFORE UPDATE ON club_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
