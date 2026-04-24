-- =============================================
-- Email Notifications Schema (2026-04-24)
-- Adds channel tracking to notification_logs and
-- per-room email dedupe flag to chat_rooms so the
-- email worker can: (a) record which channel sent
-- a notification, and (b) only send the *first*
-- chat email per room (subsequent messages skip
-- the email path).
-- =============================================

-- 1. notification_logs: track delivery channel (push vs email)
--    Existing rows are backfilled to 'push' via DEFAULT.
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'push'
    CHECK (channel IN ('push', 'email'));

COMMENT ON COLUMN public.notification_logs.channel IS
  'Delivery channel for this notification log entry: push or email.';


-- 2. chat_rooms: dedupe flag for first-message email
--    NULL  = no email sent yet (next message triggers email + sets timestamp)
--    NOT NULL = email already sent, skip email path for subsequent messages
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS email_notified_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.chat_rooms.email_notified_at IS
  'Timestamp of the first email notification sent for this room. NULL means no email has been sent yet; subsequent messages skip the email channel once this is set.';
