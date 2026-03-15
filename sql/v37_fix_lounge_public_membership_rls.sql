-- =============================================
-- v37_fix_lounge_public_membership_rls.sql
-- Fix public lounge visibility by making membership helper bypass RLS safely
-- =============================================

CREATE OR REPLACE FUNCTION public.has_active_lounge_membership(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.lounge_memberships lm
        WHERE lm.user_id = target_user_id
          AND lm.status = 'active'
          AND lm.starts_at <= NOW()
          AND lm.ends_at >= NOW()
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_lounge_membership(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_lounge_membership(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_active_lounge_membership(UUID) TO authenticated;

