-- v20_fix_push_policy.sql
-- Fix RLS: Enable UPDATE for users on push_subscriptions to allow upsert

CREATE POLICY "Users can update own subscription"
    ON push_subscriptions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
