-- =============================================
-- v34_lounge_priority_and_sources.sql
-- Lounge display priority and source attribution
-- =============================================

ALTER TABLE lounge_businesses
ADD COLUMN IF NOT EXISTS display_priority INTEGER NOT NULL DEFAULT 0;

ALTER TABLE lounge_events
ADD COLUMN IF NOT EXISTS display_priority INTEGER NOT NULL DEFAULT 0;

ALTER TABLE lounge_metrics
ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_lounge_businesses_display_priority
ON lounge_businesses(display_priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lounge_events_display_priority
ON lounge_events(display_priority DESC, start_time ASC);

CREATE INDEX IF NOT EXISTS idx_lounge_metrics_source
ON lounge_metrics(source);
