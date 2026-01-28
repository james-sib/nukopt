-- Accounts (one per API key passport)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mailboxes (max 5 per account)
CREATE TABLE mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  local_part TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (auto-delete after 7 days)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,
  from_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  extracted JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mailboxes_account ON mailboxes(account_id);
CREATE INDEX idx_mailboxes_local ON mailboxes(local_part);
CREATE INDEX idx_messages_mailbox ON messages(mailbox_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Auto-delete messages older than 7 days (run via cron)
-- DELETE FROM messages WHERE created_at < NOW() - INTERVAL '7 days';
