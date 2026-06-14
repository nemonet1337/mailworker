-- Add folder, trash, and star support to emails
ALTER TABLE emails ADD COLUMN is_trashed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE emails ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;
ALTER TABLE emails ADD COLUMN folder TEXT NOT NULL DEFAULT 'inbox';

CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed);
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred);
