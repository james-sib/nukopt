-- Create feedback/tickets table for nukopt
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nukopt_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES nukopt_accounts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'other',
  status VARCHAR(20) DEFAULT 'open',
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_nukopt_feedback_account ON nukopt_feedback(account_id);
CREATE INDEX idx_nukopt_feedback_status ON nukopt_feedback(status);
CREATE INDEX idx_nukopt_feedback_created ON nukopt_feedback(created_at DESC);

-- Enable RLS (optional, service key bypasses RLS)
ALTER TABLE nukopt_feedback ENABLE ROW LEVEL SECURITY;
