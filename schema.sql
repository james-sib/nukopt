-- NUKOPT - Email Service for AI Agents
-- Receive-only email with API Key Passport registration
-- Tables prefixed nukopt_ to keep separate from other projects

-- Accounts (one per AI API key - the "passport")
CREATE TABLE nukopt_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,      -- SHA256 hash of user's AI API key (never store original)
  provider TEXT NOT NULL,              -- openai, anthropic, openrouter
  api_key TEXT UNIQUE NOT NULL,        -- Our issued nk-... key
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mailboxes (max 5 per account on free tier)
CREATE TABLE nukopt_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES nukopt_accounts(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,          -- random123@nukopt.com
  local_part TEXT UNIQUE NOT NULL,     -- random123
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (auto-delete after 7 days)
CREATE TABLE nukopt_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES nukopt_mailboxes(id) ON DELETE CASCADE,
  from_address TEXT,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  otp TEXT,                            -- Auto-extracted OTP/verification code
  verification_links TEXT[],           -- Auto-extracted verification URLs
  raw_size INT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nukopt_accounts_key ON nukopt_accounts(api_key);
CREATE INDEX idx_nukopt_mailboxes_account ON nukopt_mailboxes(account_id);
CREATE INDEX idx_nukopt_mailboxes_local ON nukopt_mailboxes(local_part);
CREATE INDEX idx_nukopt_messages_mailbox ON nukopt_messages(mailbox_id);
CREATE INDEX idx_nukopt_messages_received ON nukopt_messages(received_at);

-- Cleanup job: Delete messages older than 7 days
-- Run via cron or pg_cron:
-- DELETE FROM nukopt_messages WHERE received_at < NOW() - INTERVAL '7 days';
