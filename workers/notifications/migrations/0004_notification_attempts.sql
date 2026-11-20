CREATE TABLE notification_attempts (
  id TEXT PRIMARY KEY,
  account_no TEXT NOT NULL,
  device_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  check_date TEXT NOT NULL,
  balance REAL,
  threshold_bdt REAL NOT NULL,
  outcome TEXT NOT NULL,
  provider_status INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_notification_attempts_account
  ON notification_attempts(account_no, device_id, subscription_id, created_at DESC);
