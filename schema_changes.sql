-- =============================================
-- 🏒 Power Play - Schema Changes
-- 추가 마이그레이션 SQL (기존 schema.sql 이후 적용)
-- =============================================

-- =============================================
-- 1. matches 테이블 - 계좌번호 칼럼 추가
-- =============================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS bank_account TEXT;

COMMENT ON COLUMN matches.bank_account IS 'Bank account info for payment (e.g., 카카오뱅크 3333-01-1234567 홍길동)';

-- =============================================
-- 2. profiles 테이블 - 회원 탈퇴용 Soft Delete 칼럼
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.deleted_at IS 'Soft delete timestamp. NULL이면 활성 계정, 값이 있으면 탈퇴한 계정';

-- =============================================
-- 적용 방법
-- =============================================
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 열기
-- 3. 위 쿼리들을 복사하여 실행
-- =============================================
