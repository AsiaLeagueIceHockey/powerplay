ALTER TABLE matches ADD COLUMN rental_available BOOLEAN DEFAULT false;

-- Update existing records: if rental_fee > 0, set rental_available = true
UPDATE matches SET rental_available = true WHERE rental_fee > 0;
