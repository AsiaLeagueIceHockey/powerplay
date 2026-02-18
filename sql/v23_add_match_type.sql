-- Create the match_type enum
CREATE TYPE match_type AS ENUM ('training', 'game');

-- Add the column with a default value
ALTER TABLE matches 
ADD COLUMN match_type match_type NOT NULL DEFAULT 'training';

-- Add comment
COMMENT ON COLUMN matches.match_type IS 'Type of the match: training (practice) or game (scrimmage)';
