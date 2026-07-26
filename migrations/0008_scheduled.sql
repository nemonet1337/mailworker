-- 予約送信
ALTER TABLE emails ADD COLUMN scheduled_at TEXT;
ALTER TABLE emails ADD COLUMN send_attempts INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_emails_scheduled ON emails(scheduled_at) WHERE scheduled_at IS NOT NULL;
