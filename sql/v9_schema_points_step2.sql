-- =============================================
-- 🏒 Power Play - 포인트 시스템 스키마 (2/2)
-- schema_points_step2.sql
-- 
-- ⚠️ schema_points_step1.sql을 먼저 실행한 후
--    이 파일을 실행하세요.
-- =============================================

-- =============================================
-- 1. 테이블 수정
-- =============================================

-- profiles 테이블에 points 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
COMMENT ON COLUMN profiles.points IS '사용자 보유 포인트 (1포인트 = 1원)';

-- matches 테이블에 entry_points 컬럼 추가
ALTER TABLE matches ADD COLUMN IF NOT EXISTS entry_points INTEGER DEFAULT 0;
COMMENT ON COLUMN matches.entry_points IS '경기 참가에 필요한 포인트';

-- 기존 fee 값을 entry_points로 마이그레이션
UPDATE matches SET entry_points = fee WHERE entry_points = 0 AND fee > 0;

-- =============================================
-- 2. 새 테이블 생성
-- =============================================

-- 포인트 거래 내역 테이블
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type point_transaction_type NOT NULL,
    amount INTEGER NOT NULL,                      -- 양수: 적립, 음수: 차감
    balance_after INTEGER NOT NULL,               -- 거래 후 잔액
    description TEXT,                             -- 거래 설명 (예: "경기 참가", "충전")
    reference_id UUID,                            -- 관련 ID (match_id 또는 charge_request_id)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE point_transactions IS '포인트 거래 내역';
COMMENT ON COLUMN point_transactions.amount IS '양수: 적립, 음수: 차감';
COMMENT ON COLUMN point_transactions.reference_id IS '관련 경기 ID 또는 충전 요청 ID';

-- 포인트 충전 요청 테이블
CREATE TABLE IF NOT EXISTS point_charge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,                      -- 충전 요청 금액
    status charge_request_status DEFAULT 'pending',
    depositor_name TEXT,                          -- 입금자명
    confirmed_by UUID REFERENCES profiles(id),    -- 확인한 관리자
    confirmed_at TIMESTAMPTZ,                     -- 확인 시간
    reject_reason TEXT,                           -- 거부 사유
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE point_charge_requests IS '포인트 충전 요청';
COMMENT ON COLUMN point_charge_requests.depositor_name IS '입금자명 (은행 이체 시 확인용)';

-- 플랫폼 설정 테이블 (계좌정보, 환불정책 등)
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,                         -- 복잡한 설정을 위해 JSONB 사용
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE platform_settings IS '플랫폼 전역 설정';

-- 기본 설정 데이터 삽입
INSERT INTO platform_settings (key, value) VALUES 
    ('bank_account', '{"bank": "", "account": "", "holder": ""}'),
    ('refund_policy', '{"rules": [
        {"hoursBeforeMatch": 24, "refundPercent": 100},
        {"hoursBeforeMatch": 6, "refundPercent": 50},
        {"hoursBeforeMatch": 0, "refundPercent": 0}
    ]}')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 3. 인덱스
-- =============================================

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_charge_requests_user_id ON point_charge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_point_charge_requests_status ON point_charge_requests(status);

-- =============================================
-- 4. 트리거 (updated_at 자동 갱신)
-- =============================================

DROP TRIGGER IF EXISTS update_point_charge_requests_updated_at ON point_charge_requests;
CREATE TRIGGER update_point_charge_requests_updated_at
    BEFORE UPDATE ON point_charge_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. RLS 정책
-- =============================================

-- point_transactions RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
CREATE POLICY "Users can view own transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superusers can view all transactions" ON point_transactions;
CREATE POLICY "Superusers can view all transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

DROP POLICY IF EXISTS "System can insert transactions" ON point_transactions;
CREATE POLICY "System can insert transactions"
    ON point_transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- 서버 액션에서만 호출되므로 허용

-- point_charge_requests RLS
ALTER TABLE point_charge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own charge requests" ON point_charge_requests;
CREATE POLICY "Users can view own charge requests"
    ON point_charge_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superusers can view all charge requests" ON point_charge_requests;
CREATE POLICY "Superusers can view all charge requests"
    ON point_charge_requests FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

DROP POLICY IF EXISTS "Users can insert own charge requests" ON point_charge_requests;
CREATE POLICY "Users can insert own charge requests"
    ON point_charge_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending requests" ON point_charge_requests;
CREATE POLICY "Users can update own pending requests"
    ON point_charge_requests FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superusers can update any charge request" ON point_charge_requests;
CREATE POLICY "Superusers can update any charge request"
    ON point_charge_requests FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

-- platform_settings RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings are publicly readable" ON platform_settings;
CREATE POLICY "Platform settings are publicly readable"
    ON platform_settings FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Only superusers can update settings" ON platform_settings;
CREATE POLICY "Only superusers can update settings"
    ON platform_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

DROP POLICY IF EXISTS "Only superusers can insert settings" ON platform_settings;
CREATE POLICY "Only superusers can insert settings"
    ON platform_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superuser'
        )
    );

-- =============================================
-- 6. 헬퍼 함수
-- =============================================

-- SuperUser 확인 함수
CREATE OR REPLACE FUNCTION is_superuser()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superuser'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 환불 비율 계산 함수
CREATE OR REPLACE FUNCTION calculate_refund_percent(p_match_start_time TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
    hours_diff NUMERIC;
    refund_rules JSONB;
    rule JSONB;
BEGIN
    -- 경기 시작까지 남은 시간 계산
    hours_diff := EXTRACT(EPOCH FROM (p_match_start_time - NOW())) / 3600;
    
    -- 환불 정책 가져오기
    SELECT value -> 'rules' INTO refund_rules
    FROM platform_settings
    WHERE key = 'refund_policy';
    
    -- 규칙이 없으면 100% 환불
    IF refund_rules IS NULL THEN
        RETURN 100;
    END IF;
    
    -- 규칙을 hoursBeforeMatch 내림차순으로 순회하며 적용
    FOR rule IN SELECT * FROM jsonb_array_elements(refund_rules) ORDER BY (value->>'hoursBeforeMatch')::INTEGER DESC
    LOOP
        IF hours_diff >= (rule->>'hoursBeforeMatch')::NUMERIC THEN
            RETURN (rule->>'refundPercent')::INTEGER;
        END IF;
    END LOOP;
    
    -- 기본값: 환불 불가
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. 초기 SuperUser 설정 (수동 실행 필요)
-- =============================================

-- 특정 사용자를 SuperUser로 지정하려면 아래 쿼리를 실행하세요:
-- UPDATE profiles SET role = 'superuser' WHERE email = 'your-email@example.com';
