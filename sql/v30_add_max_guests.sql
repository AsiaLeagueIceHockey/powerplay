-- v30: Add max_guests column for training match guest recruitment
-- NULL = unlimited guest recruitment
-- Integer value = maximum guest count limit

ALTER TABLE matches ADD COLUMN max_guests INTEGER DEFAULT NULL;
