-- =============================================
-- Rollback Script: v50 Revert (2026-04-24)
-- Removes the changes added by:
-- v50_email_notifications_schema.sql
-- =============================================

-- 1. Revert chat_rooms.email_notified_at
ALTER TABLE public.chat_rooms
  DROP COLUMN IF EXISTS email_notified_at;

-- 2. Revert notification_logs.channel
--    (drops the CHECK constraint implicitly with the column)
ALTER TABLE public.notification_logs
  DROP COLUMN IF EXISTS channel;
