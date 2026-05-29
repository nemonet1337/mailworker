-- シードアカウントを削除し、初回セットアップフローへ移行する
DELETE FROM users WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
