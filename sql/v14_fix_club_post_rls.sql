-- =============================================
-- Fix Club Post RLS Policies (2026-01-27)
-- =============================================

-- 1. Drop existing insufficient policy
DROP POLICY IF EXISTS "Admins can manage club posts" ON club_posts;

-- 2. Allow Global Admins and Superusers to manage ALL posts
CREATE POLICY "Global admins can manage all posts"
  ON club_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superuser')
    )
  );

-- 3. Allow Club Admins to manage posts for THEIR clubs
CREATE POLICY "Club admins can manage their own posts"
  ON club_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.user_id = auth.uid()
      AND club_memberships.club_id = club_posts.club_id
      AND club_memberships.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.user_id = auth.uid()
      AND club_memberships.club_id = club_posts.club_id
      AND club_memberships.role = 'admin'
    )
  );
