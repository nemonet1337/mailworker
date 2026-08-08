# mailworker

Cloudflare Workers で動く軽量 Web メールシステム。  
D1 (SQLite)・R2 (オブジェクトストレージ)・Email Workers を使用しています。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nemonet1337/mailworker)

---

## ワンクリックデプロイ (Deploy to Cloudflare ボタン)

上の **Deploy to Cloudflare** ボタンを押すと、リポジトリが自分の GitHub アカウントに複製され、必要なリソースのプロビジョニングからデプロイまで自動で行われます。

デプロイ画面で以下を設定できます：

| 項目 | 内容 |
|------|------|
| D1 データベース (`DB`) | 既存のデータベースを選択。無い場合は新規作成 |
| R2 バケット (`BUCKET`) | 既存のバケットを選択。無い場合は新規作成 |
| `MAIL_DOMAIN` | 受信メールアドレスのドメイン。自分が所有するドメインに変更 |
| `JWT_SECRET` | JWT 署名用シークレット。`openssl rand -hex 32` などで生成して設定 |

`SEND_EMAIL` (メール送信) と `RATE_LIMITER` (ブルートフォース対策) のバインディングも自動で設定されます。D1 マイグレーションは deploy スクリプト内で自動適用されます。

### Queues を使う場合 (オプション)

非同期メール処理用の Queue (`MAIL_QUEUE`) はデフォルトで無効です。使用する場合は `wrangler.toml` の以下のコメントを外してください (Workers Paid プランが必要)：

```toml
[[queues.producers]]
binding = "MAIL_QUEUE"
queue   = "mailworker-queue"
```

Deploy to Cloudflare ボタン経由なら有効化した状態でデプロイすると自動でキューが作成されます。手動の場合は `npx wrangler queues create mailworker-queue` で作成してください。

### デプロイ後の設定

1. **Email Routing の有効化**: Cloudflare ダッシュボード → 対象ゾーン → **Email → Email Routing** を有効化し、受信ルールの宛先にこの Worker を指定してください (Email Workers による受信)。送信元アドレスも Email Routing で検証が必要です。
2. **MAIL_DOMAIN を設定し忘れた場合**: ダッシュボードの Worker → 設定 → 変数、または複製されたリポジトリの `wrangler.toml` で変更できます。
3. **JWT_SECRET 未設定の場合**: `npx wrangler secret put JWT_SECRET` で設定できます (未設定のままではログインできません)。

---

## 初回ログイン

**初期アカウントは存在しません。** デプロイ後に Worker の URL へアクセスすると初回セットアップ画面が表示されるので、そこで管理者アカウントのメールアドレス・パスワードを自分で設定してください。

> **重要**: セットアップ画面はユーザーが 1 人もいない間は誰でも開けるため、デプロイ後はすぐに管理者アカウントを作成してください。

---

## 手動セットアップ手順

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

# (オプション) Queue を使う場合のみ作成 (Workers Paid プランが必要)
npx wrangler queues create mailworker-queue
```

### 3. wrangler.toml の設定確認

- `database_id`: 上記で作成した D1 データベースの UUID
- `MAIL_DOMAIN`: 受信メールアドレスのドメイン
- `[[send_email]]`: Cloudflare ダッシュボードで Email Routing を有効化
- `[[queues.producers]]`: (オプション) Queue を使う場合はコメントを外す
- Rate Limiter の `namespace_id`: Worker 内で一意な任意の正の整数 (ダッシュボードでの事前作成は不要)

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

本番は **Cloudflare Workers Builds**（リポジトリ連携）で自動デプロイします。  
GitHub Actions からはデプロイしません。

ローカルから手動で出す場合:

```bash
# リモート DB にマイグレーションを適用してデプロイ
npm run deploy
```

---

## CI / セキュリティ

| ワークフロー | 概要 |
|-------------|------|
| CI | TypeScript 型チェック（デプロイはしない） |
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
| キュー | Cloudflare Queues (オプション・非同期処理用) |
| メール受信 | Cloudflare Email Workers |
| メール送信 | Cloudflare Email Sending (`send_email` binding) |
| 認証 | JWT (HS256) + PBKDF2 パスワードハッシュ |
| フロントエンド | Hono JSX + Tailwind CSS + HTMX |
