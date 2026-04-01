-- Notification Logs Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  status TEXT CHECK (status IN ('sent', 'failed', 'no_subscription')) NOT NULL,
  devices_sent INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- SuperUsers can view all logs
CREATE POLICY "SuperUsers can view all logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'superuser')
  );

-- Server can insert logs (service role bypasses RLS)
-- No explicit policy needed for INSERT since server uses service role
