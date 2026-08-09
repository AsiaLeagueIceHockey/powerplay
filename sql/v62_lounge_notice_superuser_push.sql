-- =============================================
-- v62_lounge_notice_superuser_push.sql
-- Prevent duplicate subscriber delivery now that every SuperUser receives
-- an unconditional new-Lounge-notice push from the application layer.
-- =============================================

CREATE OR REPLACE FUNCTION public.get_lounge_notice_subscriber_ids(
    target_business_id UUID
)
RETURNS TABLE (user_id UUID)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID := auth.uid();
    caller_is_authorized BOOLEAN;
BEGIN
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'authentication required'
            USING ERRCODE = '42501';
    END IF;

    SELECT
        EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = target_business_id
              AND lb.owner_user_id = caller_id
              AND public.is_admin()
              AND public.has_active_lounge_membership(caller_id)
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.id = caller_id
              AND p.role = 'superuser'
        )
    INTO caller_is_authorized;

    IF NOT caller_is_authorized THEN
        RAISE EXCEPTION 'not authorized to read lounge notice subscribers'
            USING ERRCODE = '42501';
    END IF;

    IF NOT public.is_visible_lounge_business(target_business_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT DISTINCT subscriptions.user_id
    FROM public.lounge_notice_subscriptions AS subscriptions
    JOIN public.profiles AS subscriber_profile
      ON subscriber_profile.id = subscriptions.user_id
    WHERE subscriptions.business_id = target_business_id
      AND subscriptions.user_id <> caller_id
      AND subscriber_profile.role IS DISTINCT FROM 'superuser';
END;
$$;

REVOKE ALL ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) IS
    'Returns distinct non-SuperUser subscriber IDs to an authorized owner or SuperUser; SuperUsers receive the separate unconditional administrative push.';
