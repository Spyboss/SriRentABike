-- Drop bikes.frame_no.
--
-- The owner does not record chassis/frame numbers; the plate number is the
-- identifier that matters. The column was NOT NULL UNIQUE, so new bikes
-- could not be created without inventing a fake frame number.

ALTER TABLE bikes DROP COLUMN IF EXISTS frame_no;
