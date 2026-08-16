-- =============================================
-- v63_lounge_notice_images.sql
-- Optional single-image attachments for Lounge notices
-- =============================================

ALTER TABLE public.lounge_notices
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.lounge_notices.image_url IS
    'Optional public URL for the server-compressed Lounge notice image.';
