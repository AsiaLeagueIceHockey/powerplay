-- =============================================
-- 동호회 로고 및 대표자 정보 스키마 변경 (2026-01-15)
-- =============================================

-- 1. Add logo and representative info columns to clubs table
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS rep_name TEXT,
ADD COLUMN IF NOT EXISTS rep_phone TEXT;

COMMENT ON COLUMN clubs.logo_url IS '동호회 로고/대표 이미지 URL';
COMMENT ON COLUMN clubs.rep_name IS '대표자 이름';
COMMENT ON COLUMN clubs.rep_phone IS '대표자 연락처';

-- =============================================
-- 2. Supabase Storage 설정 (Dashboard에서 직접 설정)
-- =============================================
-- 
-- Supabase Dashboard > Storage 에서 다음 작업 수행:
--
-- (1) 새 버킷 생성:
--     - Name: club-logos
--     - Public bucket: 체크 (공개 접근 허용)
--
-- (2) 또는 SQL로 생성 (Dashboard SQL Editor에서 실행):
--     INSERT INTO storage.buckets (id, name, public) 
--     VALUES ('club-logos', 'club-logos', true);
--
-- (3) Storage Policy 추가 (인증된 사용자만 업로드 허용):
--     - Policy name: Allow authenticated uploads
--     - Operation: INSERT
--     - Definition:
--       CREATE POLICY "Allow authenticated uploads"
--       ON storage.objects FOR INSERT
--       TO authenticated
--       WITH CHECK (bucket_id = 'club-logos');
--
--     - 읽기는 Public이므로 별도 정책 필요 없음
