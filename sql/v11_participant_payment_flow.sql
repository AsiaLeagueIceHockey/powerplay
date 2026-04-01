-- =============================================
-- 🏒 Power Play - P0: 신청 플로우 개선
-- v11_participant_payment_flow.sql
-- 
-- pending_payment 상태 추가로 "한번만 신청" 플로우 구현
-- =============================================

-- =============================================
-- 1. participant_status ENUM에 pending_payment 추가
-- =============================================

-- 'pending_payment' 값이 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_payment' AND enumtypid = 'participant_status'::regtype) THEN
        ALTER TYPE participant_status ADD VALUE 'pending_payment' BEFORE 'applied';
    END IF;
END$$;

-- =============================================
-- 2. profiles 테이블 확장 (P2 준비)
-- =============================================

-- phone 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- birth_date 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- terms_agreed 컬럼 추가 (약관 동의 시간)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz;

-- =============================================
-- 3. 인덱스 추가 (pending_payment 조회 최적화)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_pending ON participants(match_id) WHERE status = 'pending_payment';
