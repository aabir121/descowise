ALTER TABLE account_watch_rules ADD COLUMN owner_id TEXT;
ALTER TABLE account_watch_rules ADD COLUMN account_id INTEGER;

-- Existing device-only registrations have no proof of DESCO ownership.
UPDATE account_watch_rules SET enabled = 0;

CREATE INDEX idx_account_watch_rules_owner_account
  ON account_watch_rules(owner_id, account_id, account_no, enabled);
