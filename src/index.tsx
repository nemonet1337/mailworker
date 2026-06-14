import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { Layout } from './gui/layout'
import { SidebarAddressItems } from './gui/layout'
import { LoginPage, LoginError } from './gui/login'
import { SetupPage, SetupError } from './gui/setup'
import { UsersPage } from './gui/admin/users'
import { AddressesPage } from './gui/admin/addresses'
import { DashboardPage } from './gui/admin/dashboard'
import { InboxPage, MailDetailPartial, SentPage, StarredPage, TrashPage, DraftsPage, SpamPage } from './gui/inbox'
import { SettingsPage } from './gui/settings'
import { ComposePage, ComposeDrawerPartial } from './gui/compose'
import { adminMiddleware } from './middleware/admin'
import { authMiddleware } from './middleware/auth'
import { AppEnv, EmailRow } from './types'
import { verifyPassword, hashPassword } from './lib/password'
import { createJwt } from './lib/jwt'
import { checkRateLimit } from './lib/rateLimit'
import { generateVapidKeys, sendWebPush } from './lib/webpush'
import emailHandler from './email'

const app = new Hono<AppEnv>()

app.use('*', authMiddleware)
app.use('/admin/*', adminMiddleware)

const PAGE_SIZE = 50

app.get('/', async (c) => {
  const user = c.get('user')!

  const addrRows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  const addresses = (addrRows.results as { address: string }[]).map((r) => r.address)

  const selectedAddr = c.req.query('addr') ?? ''
  const validAddr = addresses.includes(selectedAddr) ? selectedAddr : ''
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  let query: string
  let params: unknown[]
  if (validAddr) {
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred
      FROM emails e WHERE e.to_address = ? AND e.is_trashed = 0 AND (e.folder = 'inbox' OR e.folder IS NULL)
      ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`
    params = [validAddr]
  } else {
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred
      FROM emails e
      JOIN mail_addresses m ON LOWER(m.address) = LOWER(e.to_address)
      WHERE m.user_id = ? AND e.is_trashed = 0 AND (e.folder = 'inbox' OR e.folder IS NULL)
      ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`
    params = [user.id]
  }

  const result = await c.env.DB.prepare(query).bind(...params).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  const displayRows = hasNext ? rows.slice(0, PAGE_SIZE) : rows

  return c.html(
    <InboxPage
      currentUser={user}
      emails={displayRows}
      addresses={addresses}
      selectedAddr={validAddr}
      page={page}
      hasNext={hasNext}
    />
  )
})

// GET /sidebar/unread — 未読数バッジ (HTMX ポーリング用)
app.get('/sidebar/unread', async (c) => {
  const user = c.get('user')!
  const cnt = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM emails e
    JOIN mail_addresses m ON m.address = e.to_address
    WHERE m.user_id = ? AND e.is_read = 0
  `).bind(user.id).first<{ cnt: number }>()
  const n = cnt?.cnt ?? 0
  return c.text(n > 0 ? String(n) : '')
})

// GET /sidebar/addresses — サイドバーアドレスナビ (HTMX lazy load)
app.get('/sidebar/addresses', async (c) => {
  const user = c.get('user')!
  const rows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  const addrs = (rows.results as { address: string }[]).map((r) => r.address)
  return c.html(<SidebarAddressItems addresses={addrs} />)
})

app.get('/setup', (c) => c.html(<SetupPage />))

app.post('/setup', async (c) => {
  // セットアップはユーザーが存在しない場合のみ許可
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>()
  if ((userCount?.cnt ?? 0) > 0) {
    return c.redirect('/login')
  }

  const body = await c.req.parseBody()
  const displayName = String(body.display_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!displayName || !email || password.length < 8) {
    return c.html(
      <SetupError title="入力エラー" desc="全ての項目を入力し、パスワードは8文字以上にしてください" />,
      400,
    )
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const createdAt = new Date().toISOString().slice(0, 10)
  try {
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, 1, ?)'
    ).bind(id, email, displayName, passwordHash, createdAt).run()
  } catch {
    return c.html(
      <SetupError title="作成失敗" desc="アカウントの作成に失敗しました。メールアドレスが既に使用されている可能性があります" />,
      400,
    )
  }

  return c.html(`<script>sessionStorage.setItem('__flash',JSON.stringify({msg:'管理者アカウントを作成しました',type:'success'}));location.replace('/login')</script>`)
})

app.get('/login', (c) => c.html(<LoginPage />))

app.post('/login', async (c) => {
  // JWT_SECRET 未設定のままトークンを発行しない (デプロイ直後の設定漏れ対策)
  if (!c.env.JWT_SECRET) {
    return c.html(
      <LoginError title="サーバー設定エラー" desc="JWT_SECRET が未設定です。wrangler secret put JWT_SECRET で設定してください" />,
    )
  }

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const allowed = await checkRateLimit(c.env.RATE_LIMITER, `login:${ip}`)
  if (!allowed) {
    return c.html(
      <LoginError title="試行回数超過" desc="しばらくしてから再試行してください" />,
    )
  }

  const body = await c.req.parseBody()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    return c.html(<LoginError title="入力エラー" desc="メールアドレスとパスワードを入力してください" />)
  }

  const user = await c.env.DB.prepare('SELECT id, password_hash, is_admin FROM users WHERE email = ?').bind(email).first<{id:string;password_hash:string;is_admin:0|1}>()
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html(<LoginError title="ログイン失敗" desc="メールアドレスまたはパスワードが違います" />)
  }

  const SESSION_DURATION = 30 * 24 * 60 * 60
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION
  const token = await createJwt({ sub: user.id, is_admin: user.is_admin, exp }, c.env.JWT_SECRET)
  setCookie(c, 'session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: SESSION_DURATION })
  // sessionStorage にフラッシュを書いてからリダイレクト (トースト表示用)
  return c.html(`<script>sessionStorage.setItem('__flash',JSON.stringify({msg:'ログインしました',type:'success'}));location.replace('/')</script>`)
})

app.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  c.header('HX-Redirect', '/login')
  return c.body('')
})

// ── Push Notification API ─────────────────────────────────────────────────────

app.get('/api/push/vapid-key', (c) => {
  const key = c.env.VAPID_PUBLIC_KEY
  if (!key) return c.json({ error: 'Push notifications not configured' }, 503)
  return c.json({ publicKey: key })
})

app.post('/api/push/subscribe', async (c) => {
  const user = c.get('user')!
  if (!c.env.VAPID_PUBLIC_KEY) return c.json({ error: 'Push notifications not configured' }, 503)

  const body = await c.req.json<{ endpoint: string; keys: { p256dh: string; auth: string } }>()
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return c.json({ error: 'Invalid subscription' }, 400)
  }

  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, user_id = excluded.user_id`,
  ).bind(id, user.id, body.endpoint, body.keys.p256dh, body.keys.auth).run()

  return c.json({ ok: true })
})

app.post('/api/push/unsubscribe', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ endpoint: string }>()
  if (!body?.endpoint) return c.json({ error: 'Missing endpoint' }, 400)

  await c.env.DB.prepare(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
  ).bind(user.id, body.endpoint).run()

  return c.json({ ok: true })
})

// Admin: generate VAPID keys (one-time setup helper)
app.get('/admin/vapid/generate', async (c) => {
  const keys = await generateVapidKeys()
  return c.html(
    `<!doctype html><html><body style="font-family:monospace;padding:2rem;line-height:2">
    <h2>VAPID Keys (one-time generation)</h2>
    <p>Run the following commands to set them as Worker secrets:</p>
    <pre style="background:#f0f0f0;padding:1rem;border-radius:4px">
wrangler secret put VAPID_PUBLIC_KEY
# paste: ${keys.publicKey}

wrangler secret put VAPID_PRIVATE_KEY_JWK
# paste: ${keys.privateKeyJwk}

wrangler secret put VAPID_SUBJECT
# paste: mailto:admin@${c.env.MAIL_DOMAIN}
    </pre>
    <p style="color:red">⚠️ This page shows the private key — do not share or reload unnecessarily.</p>
    </body></html>`
  )
})

app.get('/settings', (c) => {
  const user = c.get('user')!
  return c.html(<SettingsPage currentUser={user} />)
})

app.post('/settings/password', async (c) => {
  const user = c.get('user')!
  const body = await c.req.parseBody()
  const currentPw = String(body.current_password || '')
  const newPw = String(body.new_password || '')
  if (newPw.length < 8) return c.html('<p class="text-red-500 text-sm mt-2">新しいパスワードは8文字以上にしてください</p>', 400)
  const row = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first<{password_hash:string}>()
  if (!row || !(await verifyPassword(currentPw, row.password_hash))) {
    return c.html('<p class="text-red-500 text-sm mt-2">現在のパスワードが正しくありません</p>', 401)
  }
  const newHash = await hashPassword(newPw)
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run()
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'パスワードを変更しました', type: 'success' } }))
  return c.html('')
})

// GET /compose/drawer — ドロワー Partial (HTMX)
app.get('/compose/drawer', async (c) => {
  const user = c.get('user')!
  const rows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  const from_addresses = (rows.results as { address: string }[]).map((r) => r.address)
  if (from_addresses.length === 0) {
    return c.html(
      <div class="compose-drawer" id="compose-drawer">
        <div class="compose-header">
          <span class="compose-title">新規メール</span>
          <div class="compose-header-actions">
            <button
              class="icon-btn"
              title="閉じる"
              onclick="document.getElementById('compose-slot').innerHTML=''"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="compose-body" style="padding:24px;text-align:center;color:var(--sub)">
          <p>送信元メールアドレスが設定されていません。</p>
          <a href="/settings" style="color:var(--accent)">設定画面</a>でアドレスを追加してください。
        </div>
      </div>
    )
  }

  const replyToId = c.req.query('replyTo')
  let replyTo: { subject: string; from_: string } | undefined
  if (replyToId) {
    const mail = await c.env.DB.prepare(
      'SELECT subject, from_ FROM emails WHERE id = ?'
    ).bind(replyToId).first<{ subject: string; from_: string }>()
    if (mail) replyTo = mail
  }

  return c.html(<ComposeDrawerPartial from_addresses={from_addresses} replyTo={replyTo} />)
})

// GET /compose — 作成画面
app.get('/compose', async (c) => {
  const user = c.get('user')!
  const rows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  const from_addresses = (rows.results as { address: string }[]).map((r) => r.address)
  if (from_addresses.length === 0) {
    return c.html(
      <Layout title="メール作成" user={user}>
        <p class="text-red-500">送信元アドレスが設定されていません。管理者にご連絡ください。</p>
      </Layout>
    )
  }
  return c.html(<ComposePage currentUser={user} from_addresses={from_addresses} />)
})

// POST /compose — 送信処理
app.post('/compose', async (c) => {
  const user = c.get('user')!
  const body = await c.req.parseBody()
  const from_ = String(body.from_ || '').trim()
  const to    = String(body.to    || '').trim()
  const subject = String(body.subject || '').trim() || '(件名なし)'
  const text    = String(body.body    || '').trim()

  if (!from_ || !to || !text) {
    return c.html('<p class="text-red-500 text-sm">必須項目を入力してください</p>', 400)
  }

  const owned = await c.env.DB.prepare(
    'SELECT 1 FROM mail_addresses WHERE user_id = ? AND address = ?'
  ).bind(user.id, from_).first()
  if (!owned) {
    return c.html('<p class="text-red-500 text-sm">送信元アドレスが不正です</p>', 403)
  }

  try {
    // 非 ASCII 件名を RFC 2047 base64 エンコード
    const encodedSubject = encodeMailHeader(subject)
    const rawEmail = [
      'MIME-Version: 1.0',
      `From: ${from_}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      text,
    ].join('\r\n')

    const { readable, writable } = new TransformStream<Uint8Array>()
    const writer = writable.getWriter()
    writer.write(new TextEncoder().encode(rawEmail))
    writer.close()

    const message = new EmailMessage(from_, to, readable)
    await c.env.SEND_EMAIL.send(message)

    // 送信済みフォルダに保存
    const sentId = crypto.randomUUID()
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, received_at, is_read, folder)
       VALUES (?, '', ?, ?, ?, ?, ?, 1, 'sent')`
    ).bind(sentId, to, from_, subject, text, now).run()
  } catch (e) {
    console.error('Email send error:', e)
    return c.html('<p class="text-red-500 text-sm">送信に失敗しました。しばらくしてから再試行してください</p>', 502)
  }

  c.header('HX-Trigger', JSON.stringify({ showToast: { message: '送信しました', type: 'success' } }))
  return c.html('')
})

// GET /mail/:id — メール本文取得 (htmx パーシャル)
app.get('/mail/:id', async (c) => {
  const user = c.get('user')!
  const email = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.to_address, e.subject, e.received_at, e.body_text, e.body_html, e.is_starred, e.is_trashed, e.folder
    FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE e.id = ? AND m.user_id = ?
  `).bind(c.req.param('id'), user.id)
    .first<{id:string;from_:string;to_address:string;subject:string;received_at:string;body_text:string;body_html:string|null;is_starred:number;is_trashed:number;folder:string}>()
  if (!email) return c.text('Not Found', 404)
  const attachments = await c.env.DB.prepare(
    'SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?'
  ).bind(c.req.param('id')).all()
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})

// GET /attachments/:id — 添付ファイルダウンロード
app.get('/attachments/:id', async (c) => {
  const user = c.get('user')!
  const row = await c.env.DB.prepare(`
    SELECT a.r2_key, a.filename, a.content_type
    FROM attachments a
    JOIN emails e ON e.id = a.email_id
    JOIN mail_addresses m ON m.address = e.to_address
    WHERE a.id = ? AND m.user_id = ?
  `).bind(c.req.param('id'), user.id).first<{r2_key:string;filename:string;content_type:string}>()
  if (!row) return c.text('Not Found', 404)

  const object = await c.env.BUCKET.get(row.r2_key)
  if (!object) return c.text('Not Found', 404)

  c.header('Content-Type', row.content_type)
  c.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`)
  return c.body(object.body)
})

// POST /mail/:id/read — 既読フラグ更新
app.post('/mail/:id/read', async (c) => {
  const user = c.get('user')!
  await c.env.DB.prepare(`
    UPDATE emails SET is_read = 1
    WHERE id = ? AND to_address IN (
      SELECT address FROM mail_addresses WHERE user_id = ?
    )
  `).bind(c.req.param('id'), user.id).run()
  return c.body('')
})

// POST /mail/:id/unread — 未読に戻す
app.post('/mail/:id/unread', async (c) => {
  const user = c.get('user')!
  await c.env.DB.prepare(`
    UPDATE emails SET is_read = 0
    WHERE id = ? AND to_address IN (
      SELECT address FROM mail_addresses WHERE user_id = ?
    )
  `).bind(c.req.param('id'), user.id).run()
  return c.body('')
})

// POST /mail/:id/trash — ゴミ箱へ移動
app.post('/mail/:id/trash', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')
  await c.env.DB.prepare(`
    UPDATE emails SET is_trashed = 1
    WHERE id = ? AND (to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
      OR from_ IN (SELECT address FROM mail_addresses WHERE user_id = ?))
  `).bind(emailId, user.id, user.id).run()
  return c.html('')
})

// POST /mail/:id/restore — ゴミ箱から復元
app.post('/mail/:id/restore', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')
  await c.env.DB.prepare(`
    UPDATE emails SET is_trashed = 0
    WHERE id = ? AND (to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
      OR from_ IN (SELECT address FROM mail_addresses WHERE user_id = ?))
  `).bind(emailId, user.id, user.id).run()
  return c.html('')
})

// POST /mail/:id/star — お気に入りに追加
app.post('/mail/:id/star', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')
  await c.env.DB.prepare(`
    UPDATE emails SET is_starred = 1
    WHERE id = ? AND (to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
      OR from_ IN (SELECT address FROM mail_addresses WHERE user_id = ?))
  `).bind(emailId, user.id, user.id).run()
  // 更新後の詳細を返す
  const email = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.to_address, e.subject, e.received_at, e.body_text, e.body_html, e.is_starred, e.is_trashed, e.folder
    FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE e.id = ? AND m.user_id = ?
  `).bind(emailId, user.id).first<{id:string;from_:string;to_address:string;subject:string;received_at:string;body_text:string;body_html:string|null;is_starred:number;is_trashed:number;folder:string}>()
  if (!email) return c.text('Not Found', 404)
  const attachments = await c.env.DB.prepare('SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?').bind(emailId).all()
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})

// POST /mail/:id/unstar — お気に入りを解除
app.post('/mail/:id/unstar', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')
  await c.env.DB.prepare(`
    UPDATE emails SET is_starred = 0
    WHERE id = ? AND (to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
      OR from_ IN (SELECT address FROM mail_addresses WHERE user_id = ?))
  `).bind(emailId, user.id, user.id).run()
  const email = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.to_address, e.subject, e.received_at, e.body_text, e.body_html, e.is_starred, e.is_trashed, e.folder
    FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE e.id = ? AND m.user_id = ?
  `).bind(emailId, user.id).first<{id:string;from_:string;to_address:string;subject:string;received_at:string;body_text:string;body_html:string|null;is_starred:number;is_trashed:number;folder:string}>()
  if (!email) return c.text('Not Found', 404)
  const attachments = await c.env.DB.prepare('SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?').bind(emailId).all()
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})

// POST /mail/:id/delete — 完全削除 (D1 + R2)
app.post('/mail/:id/delete', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')

  const email = await c.env.DB.prepare(`
    SELECT e.id FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE e.id = ? AND m.user_id = ?
  `).bind(emailId, user.id).first()
  if (!email) return c.text('Not Found', 404)

  const attachments = await c.env.DB.prepare(
    'SELECT r2_key FROM attachments WHERE email_id = ?'
  ).bind(emailId).all()
  for (const a of attachments.results as { r2_key: string }[]) {
    await c.env.BUCKET.delete(a.r2_key)
  }

  await c.env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(emailId).run()
  return c.html('')
})

// GET /sent — 送信済みメール
app.get('/sent', async (c) => {
  const user = c.get('user')!
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE
  const result = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.to_address, e.subject, e.received_at, 1 as is_read, e.is_starred
    FROM emails e
    JOIN mail_addresses m ON LOWER(m.address) = LOWER(e.from_)
    WHERE m.user_id = ? AND e.folder = 'sent' AND e.is_trashed = 0
    ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
  `).bind(user.id).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  return c.html(<SentPage currentUser={user} emails={hasNext ? rows.slice(0, PAGE_SIZE) : rows} page={page} hasNext={hasNext} />)
})

// GET /starred — お気に入り
app.get('/starred', async (c) => {
  const user = c.get('user')!
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE
  const result = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred
    FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE m.user_id = ? AND e.is_starred = 1 AND e.is_trashed = 0
    ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
  `).bind(user.id).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  return c.html(<StarredPage currentUser={user} emails={hasNext ? rows.slice(0, PAGE_SIZE) : rows} page={page} hasNext={hasNext} />)
})

// GET /trash — ゴミ箱
app.get('/trash', async (c) => {
  const user = c.get('user')!
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE
  const result = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred
    FROM emails e
    JOIN mail_addresses m ON (LOWER(m.address) = LOWER(e.to_address) OR LOWER(m.address) = LOWER(e.from_))
    WHERE m.user_id = ? AND e.is_trashed = 1
    ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
  `).bind(user.id).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  return c.html(<TrashPage currentUser={user} emails={hasNext ? rows.slice(0, PAGE_SIZE) : rows} page={page} hasNext={hasNext} />)
})

// GET /drafts — 下書き
app.get('/drafts', async (c) => {
  const user = c.get('user')!
  return c.html(<DraftsPage currentUser={user} />)
})

// GET /spam — スパム
app.get('/spam', async (c) => {
  const user = c.get('user')!
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE
  const result = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred
    FROM emails e
    JOIN mail_addresses m ON LOWER(m.address) = LOWER(e.to_address)
    WHERE m.user_id = ? AND e.folder = 'spam' AND e.is_trashed = 0
    ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
  `).bind(user.id).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  return c.html(<SpamPage currentUser={user} emails={hasNext ? rows.slice(0, PAGE_SIZE) : rows} page={page} hasNext={hasNext} />)
})

app.get('/admin/dashboard', async (c) => {
  const currentUser = c.get('user')!

  const [received, unread, userCnt, addrCnt, daily, addrStats, recent] = await Promise.all([
    c.env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-30 days')"
    ).first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM emails WHERE is_read = 0').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM mail_addresses').first<{ cnt: number }>(),
    c.env.DB.prepare(
      "SELECT date(received_at) as day, COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-14 days') GROUP BY day ORDER BY day"
    ).all(),
    c.env.DB.prepare(
      "SELECT to_address, COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-30 days') GROUP BY to_address ORDER BY cnt DESC LIMIT 10"
    ).all(),
    c.env.DB.prepare(
      'SELECT id, from_, subject, received_at, is_read FROM emails ORDER BY received_at DESC LIMIT 6'
    ).all(),
  ])

  return c.html(
    <DashboardPage
      currentUser={currentUser}
      receivedCount={received?.cnt ?? 0}
      unreadCount={unread?.cnt ?? 0}
      userCount={userCnt?.cnt ?? 0}
      addressCount={addrCnt?.cnt ?? 0}
      dailyData={daily.results as never[]}
      addrStats={addrStats.results as never[]}
      recentEmails={recent.results as never[]}
    />
  )
})

app.get('/admin/users', async (c) => {
  const currentUser = c.get('user')!
  const users = await c.env.DB.prepare('SELECT id, email, display_name, is_admin, created_at FROM users ORDER BY created_at DESC').all()
  const registrationAllowed = c.env.ALLOW_REGISTRATION === 'true'
  return c.html(<UsersPage currentUser={currentUser} users={users.results as never[]} registrationAllowed={registrationAllowed} />)
})

app.post('/admin/users', async (c) => {
  if (c.env.ALLOW_REGISTRATION !== 'true') {
    return c.html('<p style="color:var(--coral-deep);font-size:13px">新規ユーザー登録は無効になっています。ALLOW_REGISTRATION を "true" に設定してください。</p>', 403)
  }
  const body = await c.req.parseBody()
  const displayName = String(body.display_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const isAdmin = body.is_admin ? 1 : 0
  if (!displayName || !email || password.length < 8) return c.html('<p class="text-red-500 text-sm mt-2">入力内容を確認してください</p>', 400)

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const createdAt = new Date().toISOString().slice(0, 10)
  try {
    await c.env.DB.prepare('INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, email, displayName, passwordHash, isAdmin, createdAt).run()
  } catch {
    return c.html('<p class="text-red-500 text-sm mt-2">ユーザーの作成に失敗しました</p>', 400)
  }
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'ユーザーを追加しました', type: 'success' } }))
  return c.html('')
})

app.post('/admin/users/:id/delete', async (c) => {
  const currentUser = c.get('user')!
  const targetId = c.req.param('id')
  if (targetId === currentUser.id) {
    return c.html('<p class="text-red-500 text-sm">自分自身は削除できません</p>', 400)
  }
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run()
  return c.html('')
})

app.post('/admin/users/:id/password', async (c) => {
  const currentUser = c.get('user')!
  const targetId = c.req.param('id')
  const body = await c.req.parseBody()
  const newPassword = String(body.password || '')
  if (newPassword.length < 8) {
    return c.html('<p style="color:var(--coral);font-size:12px">パスワードは8文字以上で入力してください</p>', 400)
  }
  const passwordHash = await hashPassword(newPassword)
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, targetId).run()
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'パスワードを変更しました', type: 'success' } }))
  return c.html('')
})

app.get('/admin/addresses', async (c) => {
  const currentUser = c.get('user')!
  const users = await c.env.DB.prepare('SELECT id, email, display_name, is_admin FROM users ORDER BY display_name').all()
  const addresses = await c.env.DB.prepare('SELECT m.id, m.address, m.created_at, u.display_name FROM mail_addresses m JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC').all()
  return c.html(<AddressesPage currentUser={currentUser} users={users.results as never[]} addresses={addresses.results as never[]} domain={c.env.MAIL_DOMAIN || 'yourdomain.com'} />)
})

app.post('/admin/addresses', async (c) => {
  const body = await c.req.parseBody()
  const local = String(body.local || '').trim().toLowerCase()
  const userId = String(body.user_id || '')
  if (!local || !userId) return c.html('<p class="text-red-500 text-sm mt-2">入力内容を確認してください</p>', 400)

  const address = `${local}@${c.env.MAIL_DOMAIN || 'yourdomain.com'}`
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString().slice(0, 10)
  try {
    await c.env.DB.prepare('INSERT INTO mail_addresses (id, user_id, address, created_at) VALUES (?, ?, ?, ?)').bind(id, userId, address, createdAt).run()
  } catch {
    return c.html('<p class="text-red-500 text-sm mt-2">アドレス作成に失敗しました</p>', 400)
  }
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'アドレスを追加しました', type: 'success' } }))
  return c.html('')
})

app.post('/admin/addresses/:id/delete', async (c) => {
  const addressId = c.req.param('id')

  const row = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE id = ?'
  ).bind(addressId).first<{ address: string }>()
  if (!row) return c.body(null, 204)

  const domain = c.env.MAIL_DOMAIN || 'yourdomain.com'
  if (!row.address.endsWith(`@${domain}`)) {
    return c.html('<p class="text-red-500 text-sm">不正なアドレスです</p>', 400)
  }

  await c.env.DB.prepare('DELETE FROM mail_addresses WHERE id = ?').bind(addressId).run()
  return c.html('')
})

// ── PWA: マニフェスト ──────────────────────────────────────────────────────
app.get('/manifest.json', (c) => {
  c.header('Content-Type', 'application/manifest+json')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.json({
    name: 'WorkerMail',
    short_name: 'WorkerMail',
    description: 'nemonet.work のメールアプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf8f3',
    theme_color: '#1f1a16',
    lang: 'ja',
    orientation: 'any',
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: '受信箱', url: '/', description: '受信トレイを開く' },
      { name: 'メール作成', url: '/compose', description: '新しいメールを作成' },
    ],
  })
})

// ── PWA: アイコン ─────────────────────────────────────────────────────────
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="38" fill="#1f1a16"/>
  <rect x="30" y="56" width="132" height="92" rx="8" fill="none" stroke="#fbf8f3" stroke-width="8" stroke-linejoin="round"/>
  <path d="M30 70 96 114 162 70" fill="none" stroke="#fbf8f3" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="148" cy="56" r="22" fill="#d05a35" stroke="#1f1a16" stroke-width="5"/>
</svg>`

const ICON_MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#1f1a16"/>
  <rect x="36" y="62" width="120" height="84" rx="8" fill="none" stroke="#fbf8f3" stroke-width="7" stroke-linejoin="round"/>
  <path d="M36 76 96 114 156 76" fill="none" stroke="#fbf8f3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="140" cy="62" r="19" fill="#d05a35" stroke="#1f1a16" stroke-width="4"/>
</svg>`

app.get('/icon.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.text(ICON_SVG)
})

app.get('/icon-maskable.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.text(ICON_MASKABLE_SVG)
})

// ── PWA: サービスワーカー ──────────────────────────────────────────────────
const SW_JS = `
const CACHE = 'wm-v2';
const FONTS = 'wm-fonts-v1';
const CDN   = 'wm-cdn-v1';

// Push notification handler
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(_) {}
  var title = data.title || 'WorkerMail';
  var options = {
    body: data.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.emailId || 'mail',
    data: { url: data.url || '/' },
    requireInteraction: false,
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs) {
      for (var i = 0; i < cs.length; i++) {
        if (cs[i].url.includes(self.location.origin) && 'focus' in cs[i]) {
          return cs[i].focus().then(function(c) { return c.navigate(url); });
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/manifest.json', '/icon.svg', '/icon-maskable.svg']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => ![CACHE, FONTS, CDN].includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  // Google Fonts: cache-first
  if (/fonts\\.(googleapis|gstatic)\\.com/.test(u.hostname)) {
    e.respondWith(
      caches.open(FONTS).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))
      )
    );
    return;
  }

  // CDN (unpkg): cache-first
  if (u.hostname === 'unpkg.com') {
    e.respondWith(
      caches.open(CDN).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))
      )
    );
    return;
  }

  // Same origin: skip dynamic API paths, handle shell pages
  if (u.origin === self.location.origin) {
    const skip = ['/mail/', '/sidebar/', '/compose/drawer', '/admin/', '/attachments/', '/sw.js'];
    if (skip.some(p => u.pathname.startsWith(p))) return;

    e.respondWith(
      fetch(req, { credentials: 'same-origin' })
        .then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
          return r;
        })
        .catch(() => caches.match(req))
    );
  }
});
`

app.get('/sw.js', (c) => {
  c.header('Content-Type', 'application/javascript; charset=utf-8')
  c.header('Service-Worker-Allowed', '/')
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  return c.text(SW_JS)
})

// 非 ASCII 文字を含むメールヘッダーを RFC 2047 base64 エンコード
function encodeMailHeader(value: string): string {
  if (!/[^\x00-\x7F]/.test(value)) return value
  const bytes = new TextEncoder().encode(value)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return `=?UTF-8?B?${btoa(bin)}?=`
}

// ── Cloudflare Queue consumer ─────────────────────────────────────────────────

type PushQueueMessage = {
  type: 'new_email'
  to_address: string
  email_id: string
  from_: string
  subject: string
}

async function queueHandler(batch: MessageBatch<PushQueueMessage>, env: AppEnv['Bindings']): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY_JWK) return

  let privateKeyJwk: JsonWebKey
  try {
    privateKeyJwk = JSON.parse(env.VAPID_PRIVATE_KEY_JWK)
  } catch {
    return
  }

  const vapidSubject = env.VAPID_SUBJECT ?? `mailto:admin@${env.MAIL_DOMAIN}`

  for (const msg of batch.messages) {
    const { to_address, email_id, from_, subject } = msg.body

    // Look up the user who owns this address
    const row = await env.DB.prepare(
      `SELECT u.id FROM users u
       JOIN mail_addresses ma ON ma.user_id = u.id
       WHERE ma.address = ?`
    ).bind(to_address).first<{ id: string }>()

    if (!row) { msg.ack(); continue }

    // Get all push subscriptions for this user
    const subs = await env.DB.prepare(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?'
    ).bind(row.id).all<{ endpoint: string; p256dh: string; auth: string }>()

    const payload = JSON.stringify({
      title: `新着メール: ${from_}`,
      body: subject,
      emailId: email_id,
      url: `/mail/${email_id}`,
    })

    const results = await Promise.allSettled(
      (subs.results ?? []).map(sub =>
        sendWebPush(sub.endpoint, sub.p256dh, sub.auth, payload, privateKeyJwk, env.VAPID_PUBLIC_KEY!, vapidSubject)
      )
    )

    // Remove expired/invalid subscriptions (410 Gone)
    const subsArr = subs.results ?? []
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value.status === 410) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(subsArr[i].endpoint).run()
      }
    }

    msg.ack()
  }
}

export default {
  fetch: app.fetch.bind(app),
  email: emailHandler.email,
  queue: queueHandler,
}
