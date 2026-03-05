-- =============================================
-- 🏒 Power Play - Supabase Database Schema
-- Add is_approved to rinks table
-- =============================================

-- 1. Add column
ALTER TABLE rinks ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;

-- 2. Update existing rinks to be approved
UPDATE rinks SET is_approved = TRUE;

-- 3. Set NOT NULL constraint on existing rinks now that we've backfilled
ALTER TABLE rinks ALTER COLUMN is_approved SET NOT NULL;
