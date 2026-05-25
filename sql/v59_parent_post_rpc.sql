-- v59_parent_post_rpc.sql
-- Add RPC function to securely increment view count for youth parent posts

CREATE OR REPLACE FUNCTION increment_parent_post_views(target_post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE parent_posts
    SET views_count = views_count + 1
    WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
