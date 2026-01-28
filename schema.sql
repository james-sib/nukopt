-- NUKOPT - Email Service for AI Agents
-- Tables prefixed with nukopt_ to keep separate from other projects

-- Accounts (one per API key passport)
CREATE TABLE nukopt_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mailboxes (max 5 per account)
CREATE TABLE nukopt_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES nukopt_accounts(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  local_part TEXT UNIQUE NOT NULL,
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
  otp TEXT,
  verification_links TEXT[],
  raw_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_nukopt_mailboxes_account ON nukopt_mailboxes(account_id);
CREATE INDEX idx_nukopt_mailboxes_local ON nukopt_mailboxes(local_part);
CREATE INDEX idx_nukopt_messages_mailbox ON nukopt_messages(mailbox_id);
CREATE INDEX idx_nukopt_messages_created ON nukopt_messages(created_at);

-- Auto-delete messages older than 7 days (run via cron or pg_cron)
-- DELETE FROM nukopt_messages WHERE created_at < NOW() - INTERVAL '7 days';
