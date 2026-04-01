-- P2. 프로필 설정 강제화 (Profile Enforcement)
-- profiles 테이블에 필수 정보 및 약관 동의 컬럼 추가

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE;

-- 선택사항: 데이터 무결성을 위한 제약조건 (기존 데이터 고려하여 NOT NULL은 제외하거나 추후 적용)
-- ALTER TABLE profiles ADD CONSTRAINT check_phone_format CHECK (phone ~ '^[0-9-]+$');
