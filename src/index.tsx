import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { Layout } from './gui/layout'
import { LoginPage } from './gui/login'
import { UsersPage } from './gui/admin/users'
import { AddressesPage } from './gui/admin/addresses'
import { InboxPage, InboxRows, MailDetailPartial } from './gui/inbox'
import { SettingsPage } from './gui/settings'
import { ComposePage } from './gui/compose'
import { adminMiddleware } from './middleware/admin'
import { authMiddleware } from './middleware/auth'
import { AppEnv, EmailRow } from './types'
import { verifyPassword, hashPassword } from './lib/password'
import { createJwt } from './lib/jwt'
import { checkRateLimit } from './lib/rateLimit'
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
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read
      FROM emails e WHERE e.to_address = ?
      ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`
    params = [validAddr]
  } else {
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read
      FROM emails e
      JOIN mail_addresses m ON m.address = e.to_address
      WHERE m.user_id = ?
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

// GET /inbox/rows — 受信箱テーブル行のパーシャル (ポーリング用)
app.get('/inbox/rows', async (c) => {
  const user = c.get('user')!
  const selectedAddr = c.req.query('addr') ?? ''

  const addrRows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  const addresses = (addrRows.results as { address: string }[]).map((r) => r.address)
  const validAddr = addresses.includes(selectedAddr) ? selectedAddr : ''

  let query: string
  let params: unknown[]
  if (validAddr) {
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read
      FROM emails e WHERE e.to_address = ?
      ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE}`
    params = [validAddr]
  } else {
    query = `SELECT e.id, e.from_, e.subject, e.received_at, e.is_read
      FROM emails e
      JOIN mail_addresses m ON m.address = e.to_address
      WHERE m.user_id = ?
      ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE}`
    params = [user.id]
  }

  const emails = await c.env.DB.prepare(query).bind(...params).all()
  return c.html(<InboxRows emails={emails.results as EmailRow[]} addr={validAddr || undefined} />)
})

app.get('/login', (c) => c.html(<LoginPage />))

app.post('/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const allowed = await checkRateLimit(c.env.RATE_LIMITER, `login:${ip}`)
  if (!allowed) {
    return c.html('<p class="text-red-500 text-sm mt-2">試行回数が多すぎます。しばらくしてから再試行してください</p>', 429)
  }

  const body = await c.req.parseBody()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) return c.html('<p class="text-red-500 text-sm mt-2">メールアドレスまたはパスワードが違います</p>', 400)

  const user = await c.env.DB.prepare('SELECT id, password_hash, is_admin FROM users WHERE email = ?').bind(email).first<{id:string;password_hash:string;is_admin:0|1}>()
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html('<p class="text-red-500 text-sm mt-2">メールアドレスまたはパスワードが違います</p>', 401)
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const token = await createJwt({ sub: user.id, is_admin: user.is_admin, exp }, c.env.JWT_SECRET)
  setCookie(c, 'session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 60 * 60 * 24 })
  c.header('HX-Redirect', '/')
  return c.body('')
})

app.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  c.header('HX-Redirect', '/login')
  return c.body('')
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
  return c.html('<p class="text-green-600 text-sm mt-2">パスワードを変更しました</p>')
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
      <Layout title="メール作成" user={user} active="compose">
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

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from_ },
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  })

  if (!res.ok && res.status !== 202) {
    const detail = await res.text().catch(() => '')
    console.error('MailChannels error', res.status, detail)
    return c.html('<p class="text-red-500 text-sm">送信に失敗しました。しばらくしてから再試行してください</p>', 502)
  }

  return c.html('<p class="text-green-600 text-sm">送信しました</p>')
})

// GET /mail/:id — メール本文取得 (htmx パーシャル)
app.get('/mail/:id', async (c) => {
  const user = c.get('user')!
  const email = await c.env.DB.prepare(`
    SELECT e.id, e.from_, e.subject, e.received_at, e.body_text, e.body_html
    FROM emails e
    JOIN mail_addresses m ON m.address = e.to_address
    WHERE e.id = ? AND m.user_id = ?
  `).bind(c.req.param('id'), user.id)
    .first<{id:string;from_:string;subject:string;received_at:string;body_text:string;body_html:string|null}>()
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

// POST /mail/:id/delete — メール削除 (D1 + R2)
app.post('/mail/:id/delete', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')

  const email = await c.env.DB.prepare(`
    SELECT e.id FROM emails e
    JOIN mail_addresses m ON m.address = e.to_address
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

app.get('/admin/users', async (c) => {
  const currentUser = c.get('user')!
  const users = await c.env.DB.prepare('SELECT id, email, display_name, is_admin, created_at FROM users ORDER BY created_at DESC').all()
  return c.html(<UsersPage currentUser={currentUser} users={users.results as never[]} />)
})

app.post('/admin/users', async (c) => {
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
  return c.html('<p class="text-green-600 text-sm mt-2">ユーザーを追加しました</p>')
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
  return c.html('<p class="text-green-600 text-sm mt-2">アドレスを追加しました</p>')
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

export default {
  fetch: app.fetch.bind(app),
  email: emailHandler.email,
}
