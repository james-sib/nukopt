-- Atomic mailbox creation with limit check
-- Prevents race condition where concurrent requests bypass the limit

CREATE OR REPLACE FUNCTION create_mailbox_if_under_limit(
  p_account_id UUID,
  p_email TEXT,
  p_local_part TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(id UUID, email TEXT) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Lock the account's mailboxes to prevent concurrent inserts
  -- This is a SELECT FOR UPDATE that blocks other transactions
  SELECT COUNT(*) INTO v_count
  FROM nukopt_mailboxes
  WHERE account_id = p_account_id
  FOR UPDATE;
  
  -- If under limit, create the mailbox
  IF v_count < p_limit THEN
    RETURN QUERY
    INSERT INTO nukopt_mailboxes (account_id, email, local_part)
    VALUES (p_account_id, p_email, p_local_part)
    RETURNING nukopt_mailboxes.id, nukopt_mailboxes.email;
  END IF;
  
  -- If at or over limit, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;
