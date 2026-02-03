-- =============================================
-- Fix Push Subscription RLS (2026-02-03)
-- =============================================

-- Strictly limit "View All" access to SuperUsers only as requested.
-- Note: This might prevent regular Admins from sending push notifications to other users 
-- if they rely on client-side fetching. If "sendPushNotification" runs in a Context 
-- that requires RLS, Admins will fail to send. 
-- However, per strict instruction: "Only Superuser".

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Admins and Superusers can view all subscriptions" ON push_subscriptions;

CREATE POLICY "Superusers can view all subscriptions"
    ON push_subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );
