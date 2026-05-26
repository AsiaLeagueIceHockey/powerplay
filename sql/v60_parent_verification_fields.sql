-- v60_parent_verification_fields.sql
-- parent_applications 테이블 확장 및 자녀 하키 인증용 스토리지 버킷 추가

-- 1. parent_applications 테이블에 컬럼 추가
ALTER TABLE public.parent_applications ADD COLUMN IF NOT EXISTS parent_type TEXT CHECK (parent_type IN ('mother', 'father'));
ALTER TABLE public.parent_applications ADD COLUMN IF NOT EXISTS verification_photo_url TEXT;

COMMENT ON COLUMN public.parent_applications.parent_type IS '학부모 관계 (mother: 엄마, father: 아빠)';
COMMENT ON COLUMN public.parent_applications.verification_photo_url IS '자녀 아이스하키 인증 사진 URL';

-- 2. storage.buckets에 parent-verification 등록
INSERT INTO storage.buckets (id, name, public)
VALUES ('parent-verification', 'parent-verification', true)
ON CONFLICT (id) DO NOTHING;

-- 3. storage.objects 에 대한 RLS 정책 등록

-- 인증된 사용자라면 누구나 인증용 이미지를 업로드(INSERT)할 수 있도록 허용
CREATE POLICY "Allow authenticated to insert parent-verification"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'parent-verification'
);

-- 누구나 인증용 이미지 조회가 가능하도록 허용 (public bucket)
CREATE POLICY "Allow public select for parent-verification"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'parent-verification');

-- 본인 소유 파일 또는 어드민/슈퍼유저가 삭제 가능하도록 허용
CREATE POLICY "Allow users to delete own parent-verification"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'parent-verification' AND (
        owner = auth.uid() OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    )
);
