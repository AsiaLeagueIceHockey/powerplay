-- Add new columns to rinks table
ALTER TABLE rinks 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS rink_type TEXT CHECK (rink_type IN ('FULL', 'MINI')),
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

COMMENT ON COLUMN rinks.address IS 'Full address of the rink';
COMMENT ON COLUMN rinks.rink_type IS 'Type of rink: FULL (Standard) or MINI';
COMMENT ON COLUMN rinks.lat IS 'Latitude for map marker';
COMMENT ON COLUMN rinks.lng IS 'Longitude for map marker';
