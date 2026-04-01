-- =============================================
-- Update Profiles table (2026-02-22)
-- =============================================

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hockey_start_date DATE,
ADD COLUMN IF NOT EXISTS primary_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS detailed_positions TEXT[],
ADD COLUMN IF NOT EXISTS stick_direction TEXT CHECK (stick_direction IN ('LEFT', 'RIGHT'));

COMMENT ON COLUMN profiles.hockey_start_date IS 'When the user started playing hockey';
COMMENT ON COLUMN profiles.primary_club_id IS 'Main club the user is affiliated with';
COMMENT ON COLUMN profiles.detailed_positions IS 'Detailed positions (e.g. LW, C, RW, LD, RD, G, UNDECIDED)';
COMMENT ON COLUMN profiles.stick_direction IS 'LEFT or RIGHT stick direction';

-- Update RLS for profiles if necessary (assuming they inherit the existing ones, 
-- which allow users to read all and update their own)
