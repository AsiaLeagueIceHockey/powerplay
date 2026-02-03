-- =============================================
-- Secure Push Token Access (RPC)
-- =============================================

-- Existing RLS prevents users from reading others' subscriptions.
-- This function allows authorized fetching of push tokens for notification delivery.
-- 'SECURITY DEFINER' means this function runs with the privileges of the creator (postgres/admin),
-- bypassing RLS policies on the table.

CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Bypasses RLS
SET search_path = public -- Security best practice
AS $$
BEGIN
    -- Optional: Add logic here to restrict WHO can call this if needed.
    -- For now, any authenticated user can trigger a notification to another user
    -- (e.g. "User A invites User B"), so we allow fetching tokens by ID.
    
    RETURN QUERY
    SELECT 
        ps.id,
        ps.endpoint,
        ps.p256dh,
        ps.auth
    FROM 
        push_subscriptions ps
    WHERE 
        ps.user_id = target_user_id;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_push_tokens(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_push_tokens IS 'Allow users to fetch push tokens of other users for sending notifications (Bypasses RLS)';
