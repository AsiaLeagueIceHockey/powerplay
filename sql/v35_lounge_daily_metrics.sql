-- v35: lounge_daily_metrics - 일별 집계 테이블
-- lounge_metrics(원본 로그)의 데이터를 business_id + date 단위로 집계하여 저장
-- 배치(GitHub Action)가 매일 자정 이후 실행하여 전날까지의 데이터를 집계

CREATE TABLE IF NOT EXISTS lounge_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES lounge_businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- metrics JSONB 구조 예시:
-- {
--   "business_impressions": 15,
--   "business_clicks": 3,
--   "event_impressions": { "<event-uuid>": 8 },
--   "event_clicks": { "<event-uuid>": 1 },
--   "home_banner_impressions": 42,
--   "home_banner_clicks": 5,
--   "cta_clicks": { "detail": 3, "kakao": 1, "instagram": 2, "website": 0, "phone": 0 },
--   "source_breakdown": { "direct": 10, "home-banner-impression": 42 }
-- }

CREATE INDEX IF NOT EXISTS idx_lounge_daily_metrics_business_id ON lounge_daily_metrics(business_id);
CREATE INDEX IF NOT EXISTS idx_lounge_daily_metrics_date ON lounge_daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_daily_metrics_business_date ON lounge_daily_metrics(business_id, date DESC);

-- updated_at trigger
CREATE TRIGGER set_lounge_daily_metrics_updated_at
  BEFORE UPDATE ON lounge_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_lounge_updated_at();

-- RLS
ALTER TABLE lounge_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Owners can read their own daily metrics
DROP POLICY IF EXISTS "Owners can read own daily metrics" ON lounge_daily_metrics;
CREATE POLICY "Owners can read own daily metrics"
    ON lounge_daily_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM lounge_businesses lb
            WHERE lb.id = lounge_daily_metrics.business_id
              AND lb.owner_user_id = auth.uid()
        )
    );

-- Superusers can read all daily metrics
DROP POLICY IF EXISTS "Superusers can read all daily metrics" ON lounge_daily_metrics;
CREATE POLICY "Superusers can read all daily metrics"
    ON lounge_daily_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('superuser', 'admin')
        )
    );

-- Service role (batch) can INSERT/UPDATE via service_role key (bypasses RLS)
