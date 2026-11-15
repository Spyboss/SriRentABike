-- Rental lifecycle + payment tracking.
--
-- Before this, `status` was not a lifecycle: `completed` was written by bike
-- assignment AND by PDF download, and `signed` was written nowhere. A rental
-- could not be told apart from a filed document.
--
-- The cycle this encodes (the one the business actually runs):
--
--   pending   request received, awaiting signature / confirmation
--   signed    tourist has signed the agreement (ready for pickup)
--   active    keys handed over, bike is out
--   completed returned and settled
--
-- Overdue is deliberately NOT a stored status: it is derived as
-- `status = 'active' AND end_date < current_date`, so it cannot go stale.

-- 1. Widen the status lifecycle.
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check
  CHECK (status IN ('pending', 'signed', 'active', 'completed'));

-- 2. Money. `deposit` already exists; there was no record of what was
--    actually received, so "how much came in" was unanswerable.
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20)
  NOT NULL DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2)
  NOT NULL DEFAULT 0
  CHECK (amount_paid >= 0);

-- 3. Bookkeeping for the two moments that were previously invisible:
--    when the keys went out, and when the bike came back.
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;
