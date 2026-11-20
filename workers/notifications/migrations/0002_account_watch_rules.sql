CREATE TABLE account_watch_rules (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  account_no TEXT NOT NULL,
  label TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  threshold_bdt REAL NOT NULL,
  last_balance REAL,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(device_id, account_no)
);

CREATE INDEX idx_account_watch_rules_device ON account_watch_rules(device_id, enabled);
