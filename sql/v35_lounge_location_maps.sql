-- =============================================
-- v35_lounge_location_maps.sql
-- Lounge business/event map metadata
-- =============================================

ALTER TABLE lounge_businesses
ADD COLUMN IF NOT EXISTS map_url TEXT,
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

ALTER TABLE lounge_events
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_map_url TEXT,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_lounge_businesses_lat_lng
ON lounge_businesses(lat, lng);

CREATE INDEX IF NOT EXISTS idx_lounge_events_location_lat_lng
ON lounge_events(location_lat, location_lng);
