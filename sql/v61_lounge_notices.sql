-- =============================================
-- v61_lounge_notices.sql
-- Public Lounge notices and notice-only subscriptions
-- =============================================

-- 1. Durable notices. request_id makes a create retry idempotent within one
-- business while preserving a stable server-generated notice id.
CREATE TABLE public.lounge_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL
        REFERENCES public.lounge_businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lounge_notices_title_not_blank
        CHECK (title ~ '[^[:space:]]'),
    CONSTRAINT lounge_notices_title_length
        CHECK (CHAR_LENGTH(title) <= 120),
    CONSTRAINT lounge_notices_body_not_blank
        CHECK (body ~ '[^[:space:]]'),
    CONSTRAINT lounge_notices_body_length
        CHECK (CHAR_LENGTH(body) <= 10000),
    CONSTRAINT lounge_notices_business_request_unique
        UNIQUE (business_id, request_id)
);

CREATE INDEX idx_lounge_notices_business_created
    ON public.lounge_notices (business_id, created_at DESC, id DESC);

-- 2. Account-level, notice-only subscriptions. The primary key prevents
-- duplicate recipients; there is deliberately no mutable subscription state.
CREATE TABLE public.lounge_notice_subscriptions (
    business_id UUID NOT NULL
        REFERENCES public.lounge_businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lounge_notice_subscriptions_pkey
        PRIMARY KEY (business_id, user_id)
);

CREATE INDEX idx_lounge_notice_subscriptions_business_id
    ON public.lounge_notice_subscriptions (business_id);

-- 3. Public visibility is intentionally exposed as one boolean only. Direct
-- membership-table reads are kept inside this SECURITY DEFINER boundary so
-- anonymous and authenticated callers evaluate the same parent predicate.
CREATE OR REPLACE FUNCTION public.is_visible_lounge_business(
    target_business_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.lounge_businesses AS lb
        WHERE lb.id = target_business_id
          AND lb.is_published IS TRUE
          AND EXISTS (
              SELECT 1
              FROM public.lounge_memberships AS lm
              WHERE lm.user_id = lb.owner_user_id
                AND lm.status = 'active'
                AND lm.starts_at <= CURRENT_TIMESTAMP
                AND lm.ends_at >= CURRENT_TIMESTAMP
          )
    );
$$;

REVOKE ALL ON FUNCTION public.is_visible_lounge_business(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_visible_lounge_business(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_visible_lounge_business(UUID) TO authenticated;

-- Notice identity cannot be reassigned after creation. request_id is included
-- because allowing it to change would let a later retry create a duplicate.
CREATE OR REPLACE FUNCTION public.enforce_lounge_notice_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
        RAISE EXCEPTION 'lounge notice business_id is immutable'
            USING ERRCODE = '22000';
    END IF;

    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
        RAISE EXCEPTION 'lounge notice created_by is immutable'
            USING ERRCODE = '22000';
    END IF;

    IF NEW.request_id IS DISTINCT FROM OLD.request_id THEN
        RAISE EXCEPTION 'lounge notice request_id is immutable'
            USING ERRCODE = '22000';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_lounge_notice_immutability() FROM PUBLIC;

CREATE TRIGGER trg_lounge_notices_immutable_identity
BEFORE UPDATE ON public.lounge_notices
FOR EACH ROW
EXECUTE FUNCTION public.enforce_lounge_notice_immutability();

CREATE TRIGGER trg_lounge_notices_updated_at
BEFORE UPDATE ON public.lounge_notices
FOR EACH ROW
EXECUTE FUNCTION public.set_lounge_updated_at();

-- 4. RLS. Policies are separated by capability so permissive policy ORs do
-- not accidentally give owners subscription access or unpublished public
-- visibility.
ALTER TABLE public.lounge_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lounge_notice_subscriptions ENABLE ROW LEVEL SECURITY;

-- v33 allowed owner UPDATEs but omitted owner SELECTs. Without this policy an
-- active owner cannot load an unpublished parent in order to manage notices.
DROP POLICY IF EXISTS "Active owners can view own lounge business"
    ON public.lounge_businesses;
CREATE POLICY "Active owners can view own lounge business"
    ON public.lounge_businesses
    FOR SELECT
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        AND public.is_admin()
        AND public.has_active_lounge_membership(auth.uid())
    );

CREATE POLICY "Public can view visible lounge notices"
    ON public.lounge_notices
    FOR SELECT
    TO anon, authenticated
    USING (public.is_visible_lounge_business(business_id));

CREATE POLICY "Active owners can view own lounge notices"
    ON public.lounge_notices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = lounge_notices.business_id
              AND lb.owner_user_id = auth.uid()
              AND public.is_admin()
              AND public.has_active_lounge_membership(auth.uid())
        )
    );

CREATE POLICY "Active owners can create own lounge notices"
    ON public.lounge_notices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = lounge_notices.business_id
              AND lb.owner_user_id = auth.uid()
              AND public.is_admin()
              AND public.has_active_lounge_membership(auth.uid())
        )
    );

CREATE POLICY "Active owners can update own lounge notices"
    ON public.lounge_notices
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = lounge_notices.business_id
              AND lb.owner_user_id = auth.uid()
              AND public.is_admin()
              AND public.has_active_lounge_membership(auth.uid())
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = lounge_notices.business_id
              AND lb.owner_user_id = auth.uid()
              AND public.is_admin()
              AND public.has_active_lounge_membership(auth.uid())
        )
    );

CREATE POLICY "Active owners can delete own lounge notices"
    ON public.lounge_notices
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lounge_businesses AS lb
            WHERE lb.id = lounge_notices.business_id
              AND lb.owner_user_id = auth.uid()
              AND public.is_admin()
              AND public.has_active_lounge_membership(auth.uid())
        )
    );

CREATE POLICY "Superusers can manage all lounge notices"
    ON public.lounge_notices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.id = auth.uid()
              AND p.role = 'superuser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.id = auth.uid()
              AND p.role = 'superuser'
        )
    );

CREATE POLICY "Users can view own lounge notice subscriptions"
    ON public.lounge_notice_subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can subscribe to visible lounge notices"
    ON public.lounge_notice_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND public.is_visible_lounge_business(business_id)
    );

CREATE POLICY "Users can delete own lounge notice subscriptions"
    ON public.lounge_notice_subscriptions
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Keep direct table privileges aligned with the RLS capabilities above.
REVOKE ALL ON TABLE public.lounge_notices FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.lounge_notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lounge_notices TO authenticated;

REVOKE ALL ON TABLE public.lounge_notice_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.lounge_notice_subscriptions TO authenticated;

-- 5. Recipient enumeration reveals only subscriber UUIDs and is authorized
-- independently of public visibility. The second visibility check guarantees
-- hidden or expired parents produce zero recipients, including for superusers.
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
    WHERE subscriptions.business_id = target_business_id
      AND subscriptions.user_id <> caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) TO authenticated;

COMMENT ON FUNCTION public.is_visible_lounge_business(UUID) IS
    'Returns only whether a Lounge business is published and its owner membership is active.';

COMMENT ON FUNCTION public.get_lounge_notice_subscriber_ids(UUID) IS
    'Returns distinct subscriber user IDs to an authorized active owner or superuser; hidden and expired businesses return no recipients.';
