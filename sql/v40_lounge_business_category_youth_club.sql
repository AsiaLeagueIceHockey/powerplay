BEGIN;

-- v40_lounge_business_category_youth_club.sql
-- Allow "youth_club" as a lounge business category and keep it as the top-priority category in app code.

ALTER TABLE lounge_businesses
DROP CONSTRAINT IF EXISTS lounge_businesses_category_check;

ALTER TABLE lounge_businesses
ADD CONSTRAINT lounge_businesses_category_check
CHECK (category IN ('youth_club', 'lesson', 'training_center', 'tournament', 'brand', 'service', 'other'));

COMMIT;
