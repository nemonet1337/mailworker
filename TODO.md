# TODO — 改善計画

**2026-07-26 対応完了。** 静的解析で挙がった Phase 1〜7 を実装済み。

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | パフォーマンス / DRY / YAGNI / CSS 変数 | ✅ |
| 2 | HTML メール受信時の文字化け (QP / charset / RFC2047) | ✅ |
| 3 | Chrome Android PWA | ✅ |
| 4 | 一斉既読 | ✅ |
| 5 | 送信不能 (`send()` API / 返信宛先 / required) | ✅ |
| 6 | 予約送信 | ✅ |
| 7 | 送信ドロワー真っ白 | ✅ |

## 運用メモ（コード外）

- Cloudflare ダッシュボードで **Email Sending** に `nemonet.work` をオンボード（SPF/DKIM/DMARC）しないと任意宛先への送信は届かない
- ローカル実送信確認は `wrangler dev` にリモートバインディングが必要（現状 `--local` ではコンソール出力のみ）
- Cron のデプロイ反映は最大約 15 分かかることがある
- マイグレーション適用: `npm run db:migrate:local` / `db:migrate:remote`
- MIME テスト: `npm test`
