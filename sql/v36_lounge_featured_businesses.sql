-- =============================================
-- v36_lounge_featured_businesses.sql
-- Superuser-managed featured lounge businesses
-- =============================================

ALTER TABLE lounge_businesses
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_lounge_businesses_featured
ON lounge_businesses(is_featured DESC, featured_order ASC, created_at DESC);
