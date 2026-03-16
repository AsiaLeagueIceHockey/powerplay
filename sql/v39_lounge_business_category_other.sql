-- =============================================
-- v39_lounge_business_category_other.sql
-- Allow "other" as a lounge business category
-- =============================================

ALTER TABLE public.lounge_businesses
DROP CONSTRAINT IF EXISTS lounge_businesses_category_check;

ALTER TABLE public.lounge_businesses
ADD CONSTRAINT lounge_businesses_category_check
CHECK (category IN ('lesson', 'training_center', 'tournament', 'brand', 'service', 'other'));
