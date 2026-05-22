# mailworker

Cloudflare Workers で動く軽量 Web メールシステム。  
D1 (SQLite)・R2 (オブジェクトストレージ)・Email Workers を使用しています。

---

## 初期ログイン情報

| 項目 | 値 |
|------|-----|
| メールアドレス | `admin@localhost` |
| パスワード | `MailWorker1!` |

> **重要**: 初回ログイン後、設定画面からパスワードを変更してください。

---

## 初回セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Cloudflare リソースの作成（初回のみ）

```bash
# D1 データベースを作成
npx wrangler d1 create mail-app-db
# → 出力された database_id を wrangler.toml の database_id に設定

# R2 バケットを作成
npx wrangler r2 bucket create mailworker-bucket
```

### 3. wrangler.toml の設定確認

- `database_id`: 上記で作成した D1 データベースの UUID
- `MAIL_DOMAIN`: 受信メールアドレスのドメイン
- `[[send_email]]`: Cloudflare ダッシュボードで Email Routing を有効化
- `namespace_id` (Rate Limiter): ダッシュボードで Rate Limiting ルールを作成後、その ID を設定

### 4. シークレット変数の設定

```bash
# JWT 署名用シークレット (ランダムな文字列)
npx wrangler secret put JWT_SECRET
```

### 5. ローカル開発

```bash
# ローカル DB にマイグレーションを適用
npm run db:migrate:local

# 開発サーバーを起動
npm run dev
```

### 6. デプロイ

```bash
# リモート DB にマイグレーションを適用してデプロイ
npm run deploy
npm run db:migrate:remote
```

---

## GitHub Actions による自動デプロイ

`main` ブランチへの push で自動的にデプロイされます。  
以下の **Repository Secrets** を設定してください：

| Secret 名 | 説明 |
|-----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン (Workers 編集権限が必要) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

---

## CI / セキュリティ

| ワークフロー | 概要 |
|-------------|------|
| CI / Deploy | TypeScript 型チェック + Cloudflare Workers へのデプロイ |
| CodeQL | TypeScript 静的解析 (毎週月曜 + PR) |
| Security Scan | npm audit + Gitleaks シークレットスキャン (毎週月曜 + PR) |
| Dependabot | npm・GitHub Actions の依存関係を毎週自動更新 |

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| ランタイム | Cloudflare Workers |
| フレームワーク | Hono 4.x |
| DB | Cloudflare D1 (SQLite) |
| ストレージ | Cloudflare R2 |
| メール受信 | Cloudflare Email Workers |
| メール送信 | Cloudflare Email Sending (`send_email` binding) |
| 認証 | JWT (HS256) + PBKDF2 パスワードハッシュ |
| フロントエンド | Hono JSX + Tailwind CSS + HTMX |
