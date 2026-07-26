-- 複合索引: 一覧クエリ (to_address + is_trashed + folder + received_at)
CREATE INDEX IF NOT EXISTS idx_emails_inbox ON emails(to_address, is_trashed, folder, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sent ON emails(from_, is_trashed, folder, received_at DESC);
-- 選択性が低い単独索引を削除
DROP INDEX IF EXISTS idx_emails_is_starred;
DROP INDEX IF EXISTS idx_emails_is_trashed;
