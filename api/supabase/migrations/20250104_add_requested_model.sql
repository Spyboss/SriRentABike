ALTER TABLE agreements ADD COLUMN requested_model VARCHAR(100);
ALTER TABLE agreements ADD COLUMN outside_area BOOLEAN DEFAULT FALSE;
