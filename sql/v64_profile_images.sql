-- =============================================
-- v64_profile_images.sql
-- Optional user profile images and scoped storage
-- =============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN public.profiles.avatar_url IS
    'Optional public URL for the user-owned, server-compressed profile image.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images',
    'profile-images',
    true,
    5242880,
    ARRAY['image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Profile images are publicly readable" ON storage.objects;
CREATE POLICY "Profile images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
