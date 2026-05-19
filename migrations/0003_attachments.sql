CREATE TABLE attachments (
  id           TEXT PRIMARY KEY,
  email_id     TEXT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size         INTEGER NOT NULL DEFAULT 0,
  r2_key       TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_attachments_email_id ON attachments(email_id);
