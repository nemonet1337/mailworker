-- 初期管理者ユーザー
-- email: admin@localhost
-- password: MailWorker1!  ← 初回ログイン後に必ず変更してください
-- hash: PBKDF2-SHA256, 100000 iterations, salt = 16 zero bytes
INSERT OR IGNORE INTO users (id, email, display_name, password_hash, is_admin, created_at)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'admin@localhost',
  'Administrator',
  'AAAAAAAAAAAAAAAAAAAAAA==:lallfr6/3MuT1T0PG+ouitkPyJ8YlHshppwFljBBILY=',
  1,
  date('now')
);
