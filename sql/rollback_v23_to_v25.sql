-- =============================================
-- Rollback Script: v25 -> v23 Revert
-- This script removes the changes added by:
-- v25_chat.sql
-- v24_fix_club_membership_update_rls.sql
-- v23_regular_member_management.sql
-- =============================================

-- =============================================
-- Revert v25 (Chat)
-- =============================================

-- 1. Drop Functions
DROP FUNCTION IF EXISTS get_unread_chat_count(UUID);

-- 2. Drop Realtime Publication Table
-- Note: It's good practice to remove the table from publication before dropping it, 
-- though deleting the table usually handles this.
-- ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;

-- 3. Drop Tables (will cascade to policies, indexes, triggers)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- 4. Drop Trigger Function
DROP FUNCTION IF EXISTS update_chat_room_last_message();


-- =============================================
-- Revert v24 (Club Membership RLS)
-- =============================================

-- Dropping the policies added/modified in v24.
-- NOTE: If these policies existed BEFORE v24 and were just modified, 
-- this will leave the table with NO policies for these actions.
-- Based on v24 comments, previously there were no UPDATE policies.
DROP POLICY IF EXISTS "Club creators can update memberships" ON club_memberships;
DROP POLICY IF EXISTS "Admins can update club memberships" ON club_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON club_memberships;


-- =============================================
-- Revert v23 (Regular Member Management)
-- =============================================

-- 1. Drop Functions
DROP FUNCTION IF EXISTS get_club_member_push_tokens(UUID);
DROP FUNCTION IF EXISTS get_club_admin_push_tokens(UUID);

-- 2. Drop New Table
DROP TABLE IF EXISTS regular_match_responses CASCADE;

-- 3. Revert changes to matches table
-- Drop indexes first
DROP INDEX IF EXISTS idx_matches_match_type;

-- Drop columns
ALTER TABLE matches DROP COLUMN IF EXISTS guest_open_hours_before;
ALTER TABLE matches DROP COLUMN IF EXISTS match_type;

-- 4. Revert changes to club_memberships table
-- Drop indexes first
DROP INDEX IF EXISTS idx_club_memberships_status;

-- Drop columns
ALTER TABLE club_memberships DROP COLUMN IF EXISTS intro_message;
ALTER TABLE club_memberships DROP COLUMN IF EXISTS status;

