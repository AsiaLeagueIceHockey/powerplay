-- Add new columns for consolidated limits
ALTER TABLE matches ADD COLUMN max_skaters INTEGER DEFAULT 20;
ALTER TABLE matches ADD COLUMN max_goalies INTEGER DEFAULT 2;

-- Migrate existing data
UPDATE matches 
SET 
  max_skaters = COALESCE(max_fw, 0) + COALESCE(max_df, 0),
  max_goalies = COALESCE(max_g, 2);

-- Drop old columns (Optional: might keep them for backup first, but user asked to change)
-- ALTER TABLE matches DROP COLUMN max_fw;
-- ALTER TABLE matches DROP COLUMN max_df;
-- ALTER TABLE matches DROP COLUMN max_g;
-- We will keep them for now but ignore them in the app, or rename them to deprecated.
-- Actually drop them to clean up is better for "Refining".
ALTER TABLE matches DROP COLUMN max_fw;
ALTER TABLE matches DROP COLUMN max_df;
ALTER TABLE matches DROP COLUMN max_g;
