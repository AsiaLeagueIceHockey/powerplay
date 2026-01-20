-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per endpoint (device)
    UNIQUE(endpoint)
);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own subscription
CREATE POLICY "Users can insert own subscription"
    ON push_subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscription
CREATE POLICY "Users can delete own subscription"
    ON push_subscriptions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Only Admin or Owners can view subscriptions (Maybe just admins?)
-- For now, let users view their own.
CREATE POLICY "Users can view own subscription"
    ON push_subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
-- Admins can view all subscriptions (for sending)
CREATE POLICY "Admins can view all subscriptions"
    ON push_subscriptions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE push_subscriptions IS 'Stores Web Push API subscriptions for users';
