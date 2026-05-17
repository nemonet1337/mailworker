-- migrations/0002_emails.sql
CREATE TABLE emails (
  id          TEXT PRIMARY KEY,
  message_id  TEXT,
  to_address  TEXT NOT NULL,
  from_       TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '(件名なし)',
  body_text   TEXT NOT NULL DEFAULT '',
  body_html   TEXT,
  received_at TEXT NOT NULL,
  is_read     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_emails_to_address ON emails(to_address);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
