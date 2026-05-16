CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin      INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE mail_addresses (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address    TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);
