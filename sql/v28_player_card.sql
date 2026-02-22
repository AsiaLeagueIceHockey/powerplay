-- =============================================
-- Update Profiles table for Digital Player Card
-- =============================================

-- Create integer sequence for serial number starting from 1000
CREATE SEQUENCE IF NOT EXISTS player_card_seq START 1000;

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS card_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS card_serial_number INTEGER;

COMMENT ON COLUMN profiles.card_issued_at IS 'When the player card was issued';
COMMENT ON COLUMN profiles.card_serial_number IS 'Sequential number assigned when card is issued';

-- Create RPC function to get next serial number
CREATE OR REPLACE FUNCTION get_next_player_card_seq()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val INTEGER;
BEGIN
  SELECT nextval('player_card_seq') INTO next_val;
  RETURN next_val;
END;
$$;
