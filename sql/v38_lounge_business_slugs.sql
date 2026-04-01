-- =============================================
-- v38_lounge_business_slugs.sql
-- Add public-friendly unique slugs for lounge business pages
-- =============================================

ALTER TABLE public.lounge_businesses
ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION public.slugify_lounge_business_name(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(both '-' from regexp_replace(
      regexp_replace(lower(trim(coalesce(input, ''))), '[^a-z0-9가-힣\s-]', '', 'g'),
      '\s+',
      '-',
      'g'
    )),
    ''
  );
$$;

DO $$
DECLARE
  business_record RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER;
BEGIN
  FOR business_record IN
    SELECT id, name
    FROM public.lounge_businesses
    WHERE slug IS NULL OR btrim(slug) = ''
    ORDER BY created_at, id
  LOOP
    base_slug := public.slugify_lounge_business_name(business_record.name);
    IF base_slug IS NULL THEN
      base_slug := 'business';
    END IF;

    candidate_slug := base_slug;
    suffix := 2;

    WHILE EXISTS (
      SELECT 1
      FROM public.lounge_businesses
      WHERE slug = candidate_slug
        AND id <> business_record.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.lounge_businesses
    SET slug = candidate_slug
    WHERE id = business_record.id;
  END LOOP;
END
$$;

ALTER TABLE public.lounge_businesses
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lounge_businesses_slug
ON public.lounge_businesses(slug);

