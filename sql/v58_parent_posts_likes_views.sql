-- v58_parent_posts_likes_views.sql
-- Add views count and likes table for youth parent posts

-- 1. Add views_count to parent_posts
ALTER TABLE parent_posts ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create parent_post_likes table
CREATE TABLE IF NOT EXISTS parent_post_likes (
    post_id UUID REFERENCES parent_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE parent_post_likes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- SELECT: Allowed for approved parents or superusers
CREATE POLICY select_parent_post_likes ON parent_post_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'superuser')
        )
    );

-- INSERT: Allowed for approved parents or superusers to like (matching their own user_id)
CREATE POLICY insert_parent_post_likes ON parent_post_likes
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'superuser')
        )
    );

-- DELETE: Allowed for owners to unlike
CREATE POLICY delete_parent_post_likes ON parent_post_likes
    FOR DELETE
    USING (auth.uid() = user_id);
