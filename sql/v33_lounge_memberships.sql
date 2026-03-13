-- =============================================
-- v33_lounge_memberships.sql
-- Lounge premium membership, business showcase, events, and analytics
-- =============================================

-- 1. Membership contracts for admin users
CREATE TABLE IF NOT EXISTS lounge_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    price_krw INTEGER NOT NULL DEFAULT 100000,
    inquiry_channel TEXT CHECK (inquiry_channel IN ('kakao', 'instagram', 'manual')),
    note TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_lounge_memberships_user_id ON lounge_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_lounge_memberships_period ON lounge_memberships(starts_at, ends_at);

-- 2. One representative business profile per subscribed admin user
CREATE TABLE IF NOT EXISTS lounge_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('lesson', 'training_center', 'tournament', 'brand', 'service')),
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    address TEXT,
    phone TEXT,
    kakao_open_chat_url TEXT,
    instagram_url TEXT,
    website_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lounge_businesses_owner_user_id ON lounge_businesses(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_lounge_businesses_category ON lounge_businesses(category);
CREATE INDEX IF NOT EXISTS idx_lounge_businesses_published ON lounge_businesses(is_published);

-- 3. Multiple promotional schedules / event cards per business
CREATE TABLE IF NOT EXISTS lounge_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES lounge_businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('lesson', 'training', 'tournament', 'promotion')),
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    price_krw INTEGER,
    max_participants INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_time IS NULL OR end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_lounge_events_business_id ON lounge_events(business_id);
CREATE INDEX IF NOT EXISTS idx_lounge_events_start_time ON lounge_events(start_time);
CREATE INDEX IF NOT EXISTS idx_lounge_events_published ON lounge_events(is_published);

-- 4. Impression / click analytics for business cards and event cards
CREATE TABLE IF NOT EXISTS lounge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES lounge_businesses(id) ON DELETE CASCADE,
    event_id UUID REFERENCES lounge_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('business', 'event')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('impression', 'click')),
    cta_type TEXT CHECK (cta_type IN ('phone', 'kakao', 'instagram', 'website', 'detail')),
    locale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (business_id IS NOT NULL OR event_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_lounge_metrics_business_id ON lounge_metrics(business_id);
CREATE INDEX IF NOT EXISTS idx_lounge_metrics_event_id ON lounge_metrics(event_id);
CREATE INDEX IF NOT EXISTS idx_lounge_metrics_metric_type ON lounge_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_lounge_metrics_created_at ON lounge_metrics(created_at DESC);

-- 5. Updated-at trigger helper
CREATE OR REPLACE FUNCTION set_lounge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lounge_memberships_updated_at ON lounge_memberships;
CREATE TRIGGER trg_lounge_memberships_updated_at
BEFORE UPDATE ON lounge_memberships
FOR EACH ROW EXECUTE FUNCTION set_lounge_updated_at();

DROP TRIGGER IF EXISTS trg_lounge_businesses_updated_at ON lounge_businesses;
CREATE TRIGGER trg_lounge_businesses_updated_at
BEFORE UPDATE ON lounge_businesses
FOR EACH ROW EXECUTE FUNCTION set_lounge_updated_at();

DROP TRIGGER IF EXISTS trg_lounge_events_updated_at ON lounge_events;
CREATE TRIGGER trg_lounge_events_updated_at
BEFORE UPDATE ON lounge_events
FOR EACH ROW EXECUTE FUNCTION set_lounge_updated_at();

-- 6. Membership helper
CREATE OR REPLACE FUNCTION has_active_lounge_membership(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM lounge_memberships lm
        WHERE lm.user_id = target_user_id
          AND lm.status = 'active'
          AND lm.starts_at <= NOW()
          AND lm.ends_at >= NOW()
    );
$$;

-- 7. RLS
ALTER TABLE lounge_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_metrics ENABLE ROW LEVEL SECURITY;

-- memberships: owner read, superuser full
DROP POLICY IF EXISTS "Users can view own lounge memberships" ON lounge_memberships;
CREATE POLICY "Users can view own lounge memberships"
    ON lounge_memberships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superusers can manage lounge memberships" ON lounge_memberships;
CREATE POLICY "Superusers can manage lounge memberships"
    ON lounge_memberships FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    );

-- businesses: public read for published + active membership
DROP POLICY IF EXISTS "Public can view published lounge businesses" ON lounge_businesses;
CREATE POLICY "Public can view published lounge businesses"
    ON lounge_businesses FOR SELECT
    USING (is_published = TRUE AND has_active_lounge_membership(owner_user_id));

DROP POLICY IF EXISTS "Admins can insert own lounge business" ON lounge_businesses;
CREATE POLICY "Admins can insert own lounge business"
    ON lounge_businesses FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_user_id = auth.uid()
        AND is_admin()
        AND has_active_lounge_membership(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update own lounge business" ON lounge_businesses;
CREATE POLICY "Admins can update own lounge business"
    ON lounge_businesses FOR UPDATE
    TO authenticated
    USING (
        owner_user_id = auth.uid()
        AND is_admin()
        AND has_active_lounge_membership(auth.uid())
    )
    WITH CHECK (
        owner_user_id = auth.uid()
        AND is_admin()
        AND has_active_lounge_membership(auth.uid())
    );

DROP POLICY IF EXISTS "Superusers can manage all lounge businesses" ON lounge_businesses;
CREATE POLICY "Superusers can manage all lounge businesses"
    ON lounge_businesses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    );

-- events: public read for published events under published businesses with active membership
DROP POLICY IF EXISTS "Public can view published lounge events" ON lounge_events;
CREATE POLICY "Public can view published lounge events"
    ON lounge_events FOR SELECT
    USING (
        is_published = TRUE
        AND EXISTS (
            SELECT 1
            FROM lounge_businesses lb
            WHERE lb.id = lounge_events.business_id
              AND lb.is_published = TRUE
              AND has_active_lounge_membership(lb.owner_user_id)
        )
    );

DROP POLICY IF EXISTS "Admins can manage own lounge events" ON lounge_events;
CREATE POLICY "Admins can manage own lounge events"
    ON lounge_events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM lounge_businesses lb
            WHERE lb.id = lounge_events.business_id
              AND lb.owner_user_id = auth.uid()
              AND is_admin()
              AND has_active_lounge_membership(auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM lounge_businesses lb
            WHERE lb.id = lounge_events.business_id
              AND lb.owner_user_id = auth.uid()
              AND is_admin()
              AND has_active_lounge_membership(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Superusers can manage all lounge events" ON lounge_events;
CREATE POLICY "Superusers can manage all lounge events"
    ON lounge_events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    );

-- metrics: anyone can insert, owners/superusers can read
DROP POLICY IF EXISTS "Anyone can insert lounge metrics" ON lounge_metrics;
CREATE POLICY "Anyone can insert lounge metrics"
    ON lounge_metrics FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Owners can read own lounge metrics" ON lounge_metrics;
CREATE POLICY "Owners can read own lounge metrics"
    ON lounge_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM lounge_businesses lb
            WHERE lb.id = lounge_metrics.business_id
              AND lb.owner_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM lounge_events le
            JOIN lounge_businesses lb ON lb.id = le.business_id
            WHERE le.id = lounge_metrics.event_id
              AND lb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Superusers can read all lounge metrics" ON lounge_metrics;
CREATE POLICY "Superusers can read all lounge metrics"
    ON lounge_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'superuser'
        )
    );
