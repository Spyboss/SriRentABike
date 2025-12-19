-- Soft delete for agreements
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Document processing status tracking
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS pdf_status VARCHAR(20) DEFAULT 'none' CHECK (pdf_status IN ('none','generated','downloaded'));

-- Rate history versioning
CREATE TABLE IF NOT EXISTS rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate NUMERIC(12,2) NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by UUID,
  changed_by_email TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_history_changed_at ON rate_history(changed_at);

-- Document processing status audit (optional)
CREATE INDEX IF NOT EXISTS idx_agreements_pdf_status ON agreements(pdf_status);
