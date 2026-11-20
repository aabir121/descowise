CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_secret_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  timezone TEXT NOT NULL,
  locale TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_success_at TEXT,
  last_failure_at TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT NOT NULL DEFAULT '/',
  icon_url TEXT,
  badge_url TEXT,
  scheduled_local_time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  next_send_at TEXT NOT NULL,
  last_sent_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  processing_token TEXT,
  processing_started_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_reminders_due ON reminders(enabled, next_send_at);
CREATE INDEX idx_subscriptions_device ON push_subscriptions(device_id);

-- A small, best-effort rate limit for unauthenticated device enrolment.
CREATE TABLE rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TEXT NOT NULL
);
