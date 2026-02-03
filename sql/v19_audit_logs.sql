-- =============================================
-- Audit Logs Table (For SuperUser Monitoring)
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Actor
    action_type TEXT NOT NULL, -- e.g., 'MATCH_JOIN', 'POINT_CHARGE'
    description TEXT NOT NULL, -- Human readable message
    metadata JSONB DEFAULT '{}', -- Extra details (match_id, amount, etc.)
    ip_address TEXT
);

-- Index for faster querying by desc date
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Only SuperUsers can view
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superusers can view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

-- Allow inserts from server side (Service Role) or Authenticated users (if we want to log from client actions directly, but preferred via server actions)
-- For now, we assume insertions happen via Server Actions which run with auth user.
CREATE POLICY "Users can insert their own logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Actually, for 'after()' logging, we might use Service Role client anyway to ensure it always succeeds, 
-- but 'Users can insert' is good for RLS compliance if using standard client.
