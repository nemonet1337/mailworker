import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { Layout, SidebarAddressItems } from './gui/layout'
import { LoginPage, LoginError } from './gui/login'
import { SetupPage, SetupError } from './gui/setup'
import { UsersPage } from './gui/admin/users'
import { AddressesPage } from './gui/admin/addresses'
import { DashboardPage } from './gui/admin/dashboard'
import { InboxPage, MailDetailPartial, SentPage, StarredPage, TrashPage, SpamPage, ScheduledPage } from './gui/inbox'
import { SettingsPage } from './gui/settings'
import { ComposeDrawerPartial } from './gui/compose'
import { adminMiddleware } from './middleware/admin'
import { authMiddleware } from './middleware/auth'
import { AppEnv, EmailRow, MailDetail } from './types'
import { verifyPassword, hashPassword } from './lib/password'
import { createJwt } from './lib/jwt'
import { checkRateLimit } from './lib/rateLimit'
import { extractEmailAddr, parsePage, PAGE_SIZE } from './lib/mail'
import { CSS } from './gui/styles'
import emailHandler from './email'
import {
  ICON_192,
  ICON_512,
  ICON_192_MASKABLE,
  ICON_512_MASKABLE,
} from './assets/png-icons'

import htmxSource from './assets/htmx'

const app = new Hono<AppEnv>()

app.use('*', authMiddleware)
app.use('/admin/*', adminMiddleware)

// ── ヘルパー ──────────────────────────────────────────────────

async function getAddresses(c: Context<AppEnv>): Promise<string[]> {
  const user = c.get('user')!
  const rows = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE user_id = ? ORDER BY address'
  ).bind(user.id).all()
  return (rows.results as { address: string }[]).map((r) => r.address)
}

async function loadMailDetail(c: Context<AppEnv>, id: string): Promise<MailDetail | null> {
  const user = c.get('user')!
  return c.env.DB.prepare(`
    SELECT e.id, e.from_, e.to_address, e.subject, e.received_at, e.body_text, e.body_html,
           e.is_starred, e.is_trashed, e.folder, e.scheduled_at
    FROM emails e
    JOIN mail_addresses m ON (m.address = e.to_address OR m.address = e.from_)
    WHERE e.id = ? AND m.user_id = ?
  `).bind(id, user.id).first<MailDetail>()
}

async function loadAttachments(c: Context<AppEnv>, emailId: string) {
  return c.env.DB.prepare(
    'SELECT id, filename, content_type, size FROM attachments WHERE email_id = ?'
  ).bind(emailId).all()
}

type ListFolderOpts = {
  where: string
  params: unknown[]
  page: number
  select?: string
}

async function listFolder(c: Context<AppEnv>, opts: ListFolderOpts) {
  const page = opts.page
  const offset = (page - 1) * PAGE_SIZE
  const select = opts.select ??
    `e.id, e.from_, e.subject, e.received_at, e.is_read, e.is_starred`
  const query = `SELECT ${select}
    FROM emails e
    ${opts.where}
    ORDER BY e.received_at DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`
  const result = await c.env.DB.prepare(query).bind(...opts.params).all()
  const rows = result.results as EmailRow[]
  const hasNext = rows.length > PAGE_SIZE
  return { rows: hasNext ? rows.slice(0, PAGE_SIZE) : rows, page, hasNext }
}

const FLAG_COLS = new Set(['is_read', 'is_starred', 'is_trashed'] as const)
type FlagCol = 'is_read' | 'is_starred' | 'is_trashed'

async function setFlag(c: Context<AppEnv>, id: string, col: FlagCol, val: 0 | 1, both = false) {
  const user = c.get('user')!
  if (both) {
    await c.env.DB.prepare(`
      UPDATE emails SET ${col} = ?
      WHERE id = ? AND (to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
        OR from_ IN (SELECT address FROM mail_addresses WHERE user_id = ?))
    `).bind(val, id, user.id, user.id).run()
  } else {
    await c.env.DB.prepare(`
      UPDATE emails SET ${col} = ?
      WHERE id = ? AND to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
    `).bind(val, id, user.id).run()
  }
}

async function sendEmail(
  env: AppEnv['Bindings'],
  opts: { from: string; to: string; subject: string; text: string },
) {
  // 構造化 send() API（EmailMessage グローバルは存在しない）
  const send = env.SEND_EMAIL.send.bind(env.SEND_EMAIL) as (
    msg: { from: string; to: string; subject: string; text: string },
  ) => Promise<unknown>
  await send({ from: opts.from, to: opts.to, subject: opts.subject, text: opts.text })
}

// ── 静的アセット ──────────────────────────────────────────────

const ASSET_VERSION = 'v2'

app.get('/app.css', (c) => {
  c.header('Content-Type', 'text/css; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
  return c.body(CSS)
})

app.get('/htmx.min.js', (c) => {
  c.header('Content-Type', 'application/javascript; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=31536000, immutable')
  return c.body(htmxSource)
})

function pngResponse(c: Context, b64: string) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  c.header('Content-Type', 'image/png')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body(bytes)
}

app.get('/icon-192.png', (c) => pngResponse(c, ICON_192))
app.get('/icon-512.png', (c) => pngResponse(c, ICON_512))
app.get('/icon-192-maskable.png', (c) => pngResponse(c, ICON_192_MASKABLE))
app.get('/icon-512-maskable.png', (c) => pngResponse(c, ICON_512_MASKABLE))

// ── 受信箱 ────────────────────────────────────────────────────

app.get('/', async (c) => {
  const user = c.get('user')!
  const addresses = await getAddresses(c)
  const selectedAddr = c.req.query('addr') ?? ''
  const validAddr = addresses.includes(selectedAddr) ? selectedAddr : ''
  const page = parsePage(c.req.query('page'))

  let where: string
  let params: unknown[]
  if (validAddr) {
    where = `WHERE e.to_address = ? AND e.is_trashed = 0 AND (e.folder = 'inbox' OR e.folder IS NULL)`
    params = [validAddr]
  } else {
    where = `JOIN mail_addresses m ON m.address = e.to_address
      WHERE m.user_id = ? AND e.is_trashed = 0 AND (e.folder = 'inbox' OR e.folder IS NULL)`
    params = [user.id]
  }

  const { rows, hasNext } = await listFolder(c, { where, params, page })
  return c.html(
    <InboxPage
      currentUser={user}
      emails={rows}
      addresses={addresses}
      selectedAddr={validAddr}
      page={page}
      hasNext={hasNext}
    />,
  )
})

app.get('/sidebar/unread', async (c) => {
  const user = c.get('user')!
  const cnt = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM emails e
    JOIN mail_addresses m ON m.address = e.to_address
    WHERE m.user_id = ? AND e.is_read = 0 AND e.is_trashed = 0
      AND (e.folder = 'inbox' OR e.folder IS NULL)
  `).bind(user.id).first<{ cnt: number }>()
  const n = cnt?.cnt ?? 0
  return c.text(n > 0 ? String(n) : '')
})

app.get('/sidebar/addresses', async (c) => {
  const addrs = await getAddresses(c)
  return c.html(<SidebarAddressItems addresses={addrs} />)
})

// ── 認証 ──────────────────────────────────────────────────────

app.get('/setup', (c) => c.html(<SetupPage />))

app.post('/setup', async (c) => {
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>()
  if ((userCount?.cnt ?? 0) > 0) return c.redirect('/login')

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
      'INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, 1, ?)',
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
  if (!c.env.JWT_SECRET) {
    return c.html(
      <LoginError title="サーバー設定エラー" desc="JWT_SECRET が未設定です。wrangler secret put JWT_SECRET で設定してください" />,
    )
  }

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const allowed = await checkRateLimit(c.env.RATE_LIMITER, `login:${ip}`)
  if (!allowed) {
    return c.html(<LoginError title="試行回数超過" desc="しばらくしてから再試行してください" />)
  }

  const body = await c.req.parseBody()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) {
    return c.html(<LoginError title="入力エラー" desc="メールアドレスとパスワードを入力してください" />)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, password_hash, is_admin FROM users WHERE email = ?',
  ).bind(email).first<{ id: string; password_hash: string; is_admin: 0 | 1 }>()
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.html(<LoginError title="ログイン失敗" desc="メールアドレスまたはパスワードが違います" />)
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const token = await createJwt({ sub: user.id, is_admin: user.is_admin, exp }, c.env.JWT_SECRET)
  setCookie(c, 'session', token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24,
  })
  return c.html(`<script>sessionStorage.setItem('__flash',JSON.stringify({msg:'ログインしました',type:'success'}));location.replace('/')</script>`)
})

app.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  c.header('HX-Redirect', '/login')
  // クライアント側で SW キャッシュを消すトリガ
  c.header('HX-Trigger', JSON.stringify({ clearCaches: true }))
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
  if (newPw.length < 8) {
    return c.html('<p class="text-red-500 text-sm mt-2">新しいパスワードは8文字以上にしてください</p>', 400)
  }
  const row = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id).first<{ password_hash: string }>()
  if (!row || !(await verifyPassword(currentPw, row.password_hash))) {
    return c.html('<p class="text-red-500 text-sm mt-2">現在のパスワードが正しくありません</p>', 401)
  }
  const newHash = await hashPassword(newPw)
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run()
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'パスワードを変更しました', type: 'success' } }))
  return c.html('')
})

// ── 作成 / 送信 ───────────────────────────────────────────────

app.get('/compose/drawer', async (c) => {
  const from_addresses = await getAddresses(c)
  if (from_addresses.length === 0) {
    c.header('HX-Trigger', JSON.stringify({
      showToast: {
        message: '送信元アドレスが未設定です',
        type: 'error',
        desc: '設定画面でアドレスを追加してください',
      },
    }))
    return c.body('')
  }

  const replyToId = c.req.query('replyTo')
  let replyTo: { subject: string; from_: string } | undefined
  if (replyToId) {
    const mail = await c.env.DB.prepare(
      'SELECT subject, from_ FROM emails WHERE id = ?',
    ).bind(replyToId).first<{ subject: string; from_: string }>()
    if (mail) {
      replyTo = { subject: mail.subject, from_: extractEmailAddr(mail.from_) }
    }
  }

  return c.html(<ComposeDrawerPartial from_addresses={from_addresses} replyTo={replyTo} />)
})

app.post('/compose', async (c) => {
  const user = c.get('user')!
  const body = await c.req.parseBody()
  const from_ = String(body.from_ || '').trim()
  const to = String(body.to || '').trim().toLowerCase()
  const subject = String(body.subject || '').trim() || '(件名なし)'
  const text = String(body.body || '').trim()
  const scheduledRaw = String(body.scheduled_at || '').trim()

  if (!from_ || !to || !text) {
    return c.html('<p class="text-red-500 text-sm">必須項目を入力してください</p>', 400)
  }

  const owned = await c.env.DB.prepare(
    'SELECT 1 FROM mail_addresses WHERE user_id = ? AND address = ?',
  ).bind(user.id, from_).first()
  if (!owned) {
    return c.html('<p class="text-red-500 text-sm">送信元アドレスが不正です</p>', 403)
  }

  // 予約送信
  if (scheduledRaw) {
    const scheduledAt = new Date(scheduledRaw)
    if (!Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now()) {
      const id = crypto.randomUUID()
      await c.env.DB.prepare(
        `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, received_at, is_read, folder, scheduled_at)
         VALUES (?, '', ?, ?, ?, ?, ?, 1, 'scheduled', ?)`,
      ).bind(id, to, from_, subject, text, new Date().toISOString(), scheduledAt.toISOString()).run()
      c.header('HX-Trigger', JSON.stringify({ showToast: { message: '予約送信を登録しました', type: 'success' } }))
      return c.html('')
    }
  }

  try {
    await sendEmail(c.env, { from: from_, to, subject, text })
  } catch (e) {
    const err = e as { message?: string; code?: string | number }
    console.error('Email send error:', err?.code, err?.message ?? e)
    return c.html(
      `<p class="text-red-500 text-sm">送信に失敗しました${err?.code ? ` (${err.code})` : ''}。しばらくしてから再試行してください</p>`,
      502,
    )
  }

  try {
    const sentId = crypto.randomUUID()
    const now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, received_at, is_read, folder)
       VALUES (?, '', ?, ?, ?, ?, ?, 1, 'sent')`,
    ).bind(sentId, to, from_, subject, text, now).run()
  } catch (e) {
    console.error('Sent folder save error:', e)
    c.header('HX-Trigger', JSON.stringify({
      showToast: { message: '送信は完了しましたが、送信済みフォルダへの保存に失敗しました', type: 'error' },
    }))
    return c.html('')
  }

  c.header('HX-Trigger', JSON.stringify({ showToast: { message: '送信しました', type: 'success' } }))
  return c.html('')
})

// ── メール詳細 / フラグ ───────────────────────────────────────

app.get('/mail/:id', async (c) => {
  const email = await loadMailDetail(c, c.req.param('id'))
  if (!email) return c.text('Not Found', 404)
  const attachments = await loadAttachments(c, c.req.param('id'))
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})

app.get('/attachments/:id', async (c) => {
  const user = c.get('user')!
  const row = await c.env.DB.prepare(`
    SELECT a.r2_key, a.filename, a.content_type
    FROM attachments a
    JOIN emails e ON e.id = a.email_id
    JOIN mail_addresses m ON (m.address = e.to_address OR m.address = e.from_)
    WHERE a.id = ? AND m.user_id = ?
  `).bind(c.req.param('id'), user.id).first<{ r2_key: string; filename: string; content_type: string }>()
  if (!row) return c.text('Not Found', 404)

  const object = await c.env.BUCKET.get(row.r2_key)
  if (!object) return c.text('Not Found', 404)

  c.header('Content-Type', row.content_type)
  c.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`)
  return c.body(object.body)
})

// 一斉既読
app.post('/mail/read-all', async (c) => {
  const user = c.get('user')!
  const addr = String(c.req.query('addr') || '').trim()
  const addresses = await getAddresses(c)
  const validAddr = addresses.includes(addr) ? addr : ''

  if (validAddr) {
    await c.env.DB.prepare(`
      UPDATE emails SET is_read = 1
      WHERE is_read = 0 AND to_address = ? AND is_trashed = 0
        AND (folder = 'inbox' OR folder IS NULL)
    `).bind(validAddr).run()
  } else {
    await c.env.DB.prepare(`
      UPDATE emails SET is_read = 1
      WHERE is_read = 0 AND is_trashed = 0
        AND (folder = 'inbox' OR folder IS NULL)
        AND to_address IN (SELECT address FROM mail_addresses WHERE user_id = ?)
    `).bind(user.id).run()
  }

  c.header('HX-Trigger', JSON.stringify({
    showToast: { message: 'すべて既読にしました', type: 'success' },
    refreshUnread: true,
  }))
  return c.body('')
})

// 統合フラグ更新: POST /mail/:id/flag/:col/:val
app.post('/mail/:id/flag/:col/:val', async (c) => {
  const col = c.req.param('col') as FlagCol
  const val = Number(c.req.param('val')) as 0 | 1
  if (!FLAG_COLS.has(col) || (val !== 0 && val !== 1)) return c.text('Bad Request', 400)

  const id = c.req.param('id')
  const both = col === 'is_starred' || col === 'is_trashed'
  await setFlag(c, id, col, val, both)

  if (col === 'is_starred') {
    const email = await loadMailDetail(c, id)
    if (!email) return c.text('Not Found', 404)
    const attachments = await loadAttachments(c, id)
    return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
  }
  return c.body('')
})

// 後方互換エイリアス
app.post('/mail/:id/read', async (c) => {
  await setFlag(c, c.req.param('id'), 'is_read', 1)
  return c.body('')
})
app.post('/mail/:id/unread', async (c) => {
  await setFlag(c, c.req.param('id'), 'is_read', 0)
  return c.body('')
})
app.post('/mail/:id/trash', async (c) => {
  await setFlag(c, c.req.param('id'), 'is_trashed', 1, true)
  return c.html('')
})
app.post('/mail/:id/restore', async (c) => {
  await setFlag(c, c.req.param('id'), 'is_trashed', 0, true)
  return c.html('')
})
app.post('/mail/:id/star', async (c) => {
  const id = c.req.param('id')
  await setFlag(c, id, 'is_starred', 1, true)
  const email = await loadMailDetail(c, id)
  if (!email) return c.text('Not Found', 404)
  const attachments = await loadAttachments(c, id)
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})
app.post('/mail/:id/unstar', async (c) => {
  const id = c.req.param('id')
  await setFlag(c, id, 'is_starred', 0, true)
  const email = await loadMailDetail(c, id)
  if (!email) return c.text('Not Found', 404)
  const attachments = await loadAttachments(c, id)
  return c.html(<MailDetailPartial {...email} attachments={attachments.results as never[]} />)
})

app.post('/mail/:id/delete', async (c) => {
  const user = c.get('user')!
  const emailId = c.req.param('id')

  const email = await c.env.DB.prepare(`
    SELECT e.id FROM emails e
    JOIN mail_addresses m ON (m.address = e.to_address OR m.address = e.from_)
    WHERE e.id = ? AND m.user_id = ?
  `).bind(emailId, user.id).first()
  if (!email) return c.text('Not Found', 404)

  const attachments = await c.env.DB.prepare(
    'SELECT r2_key FROM attachments WHERE email_id = ?',
  ).bind(emailId).all()
  const keys = (attachments.results as { r2_key: string }[]).map((a) => a.r2_key)
  if (keys.length) await c.env.BUCKET.delete(keys)

  await c.env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(emailId).run()
  return c.html('')
})

// ── フォルダ一覧 ──────────────────────────────────────────────

app.get('/sent', async (c) => {
  const user = c.get('user')!
  const page = parsePage(c.req.query('page'))
  const { rows, hasNext } = await listFolder(c, {
    where: `JOIN mail_addresses m ON m.address = e.from_
      WHERE m.user_id = ? AND e.folder = 'sent' AND e.is_trashed = 0`,
    params: [user.id],
    page,
    select: `e.id, e.from_, e.to_address, e.subject, e.received_at, 1 as is_read, e.is_starred`,
  })
  return c.html(<SentPage currentUser={user} emails={rows} page={page} hasNext={hasNext} />)
})

app.get('/starred', async (c) => {
  const user = c.get('user')!
  const page = parsePage(c.req.query('page'))
  const { rows, hasNext } = await listFolder(c, {
    where: `JOIN mail_addresses m ON (m.address = e.to_address OR m.address = e.from_)
      WHERE m.user_id = ? AND e.is_starred = 1 AND e.is_trashed = 0`,
    params: [user.id],
    page,
  })
  return c.html(<StarredPage currentUser={user} emails={rows} page={page} hasNext={hasNext} />)
})

app.get('/trash', async (c) => {
  const user = c.get('user')!
  const page = parsePage(c.req.query('page'))
  const { rows, hasNext } = await listFolder(c, {
    where: `JOIN mail_addresses m ON (m.address = e.to_address OR m.address = e.from_)
      WHERE m.user_id = ? AND e.is_trashed = 1`,
    params: [user.id],
    page,
  })
  return c.html(<TrashPage currentUser={user} emails={rows} page={page} hasNext={hasNext} />)
})

app.get('/spam', async (c) => {
  const user = c.get('user')!
  const page = parsePage(c.req.query('page'))
  const { rows, hasNext } = await listFolder(c, {
    where: `JOIN mail_addresses m ON m.address = e.to_address
      WHERE m.user_id = ? AND e.folder = 'spam' AND e.is_trashed = 0`,
    params: [user.id],
    page,
  })
  return c.html(<SpamPage currentUser={user} emails={rows} page={page} hasNext={hasNext} />)
})

app.get('/scheduled', async (c) => {
  const user = c.get('user')!
  const page = parsePage(c.req.query('page'))
  const { rows, hasNext } = await listFolder(c, {
    where: `JOIN mail_addresses m ON m.address = e.from_
      WHERE m.user_id = ? AND e.folder = 'scheduled' AND e.is_trashed = 0`,
    params: [user.id],
    page,
    select: `e.id, e.from_, e.to_address, e.subject, e.received_at, 1 as is_read, e.is_starred, e.scheduled_at`,
  })
  return c.html(<ScheduledPage currentUser={user} emails={rows} page={page} hasNext={hasNext} />)
})

// ── 管理画面 ──────────────────────────────────────────────────

app.get('/admin/dashboard', async (c) => {
  const currentUser = c.get('user')!
  const [received, unread, userCnt, addrCnt, daily, addrStats, recent] = await Promise.all([
    c.env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-30 days')",
    ).first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM emails WHERE is_read = 0').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM mail_addresses').first<{ cnt: number }>(),
    c.env.DB.prepare(
      "SELECT date(received_at) as day, COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-14 days') GROUP BY day ORDER BY day",
    ).all(),
    c.env.DB.prepare(
      "SELECT to_address, COUNT(*) as cnt FROM emails WHERE received_at > datetime('now', '-30 days') GROUP BY to_address ORDER BY cnt DESC LIMIT 10",
    ).all(),
    c.env.DB.prepare(
      'SELECT id, from_, subject, received_at, is_read FROM emails ORDER BY received_at DESC LIMIT 6',
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
    />,
  )
})

app.get('/admin/users', async (c) => {
  const currentUser = c.get('user')!
  const users = await c.env.DB.prepare(
    'SELECT id, email, display_name, is_admin, created_at FROM users ORDER BY created_at DESC',
  ).all()
  return c.html(<UsersPage currentUser={currentUser} users={users.results as never[]} />)
})

app.post('/admin/users', async (c) => {
  const body = await c.req.parseBody()
  const displayName = String(body.display_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const isAdmin = body.is_admin ? 1 : 0
  if (!displayName || !email || password.length < 8) {
    return c.html('<p class="text-red-500 text-sm mt-2">入力内容を確認してください</p>', 400)
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const createdAt = new Date().toISOString().slice(0, 10)
  try {
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, display_name, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(id, email, displayName, passwordHash, isAdmin, createdAt).run()
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
  const targetId = c.req.param('id')
  const body = await c.req.parseBody()
  const newPassword = String(body.password || '')
  if (newPassword.length < 8) {
    return c.html('<p style="color:var(--accent);font-size:12px">パスワードは8文字以上で入力してください</p>', 400)
  }
  const passwordHash = await hashPassword(newPassword)
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, targetId).run()
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'パスワードを変更しました', type: 'success' } }))
  return c.html('')
})

app.get('/admin/addresses', async (c) => {
  const currentUser = c.get('user')!
  const users = await c.env.DB.prepare(
    'SELECT id, email, display_name, is_admin FROM users ORDER BY display_name',
  ).all()
  const addresses = await c.env.DB.prepare(
    'SELECT m.id, m.address, m.created_at, u.display_name FROM mail_addresses m JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC',
  ).all()
  return c.html(
    <AddressesPage
      currentUser={currentUser}
      users={users.results as never[]}
      addresses={addresses.results as never[]}
      domain={c.env.MAIL_DOMAIN || 'yourdomain.com'}
    />,
  )
})

app.post('/admin/addresses', async (c) => {
  const body = await c.req.parseBody()
  const local = String(body.local || '').trim().toLowerCase()
  const userId = String(body.user_id || '')
  if (!local || !userId) {
    return c.html('<p class="text-red-500 text-sm mt-2">入力内容を確認してください</p>', 400)
  }

  const address = `${local}@${c.env.MAIL_DOMAIN || 'yourdomain.com'}`
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString().slice(0, 10)
  try {
    await c.env.DB.prepare(
      'INSERT INTO mail_addresses (id, user_id, address, created_at) VALUES (?, ?, ?, ?)',
    ).bind(id, userId, address, createdAt).run()
  } catch {
    return c.html('<p class="text-red-500 text-sm mt-2">アドレス作成に失敗しました</p>', 400)
  }
  c.header('HX-Trigger', JSON.stringify({ showToast: { message: 'アドレスを追加しました', type: 'success' } }))
  return c.html('')
})

app.post('/admin/addresses/:id/delete', async (c) => {
  const addressId = c.req.param('id')
  const row = await c.env.DB.prepare(
    'SELECT address FROM mail_addresses WHERE id = ?',
  ).bind(addressId).first<{ address: string }>()
  if (!row) return c.body(null, 204)

  const domain = c.env.MAIL_DOMAIN || 'yourdomain.com'
  if (!row.address.endsWith(`@${domain}`)) {
    return c.html('<p class="text-red-500 text-sm">不正なアドレスです</p>', 400)
  }

  await c.env.DB.prepare('DELETE FROM mail_addresses WHERE id = ?').bind(addressId).run()
  return c.html('')
})

// ── PWA ───────────────────────────────────────────────────────

app.get('/manifest.json', (c) => {
  c.header('Content-Type', 'application/manifest+json')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.json({
    id: '/',
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
      { src: '/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
      { src: '/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
      { src: '/icon-192-maskable.png', type: 'image/png', sizes: '192x192', purpose: 'maskable' },
      { src: '/icon-512-maskable.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: '/icon-maskable.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: '受信箱', url: '/', description: '受信トレイを開く' },
      { name: 'メール作成', url: '/?compose=1', description: '新しいメールを作成' },
    ],
  })
})

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

const SW_JS = `
const CACHE = 'wm-${ASSET_VERSION}';
const FONTS = 'wm-fonts-${ASSET_VERSION}';
const STATIC = [
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/app.css',
  '/htmx.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'CLEAR_CACHES') {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))));
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  if (/fonts\\.(googleapis|gstatic)\\.com/.test(u.hostname)) {
    e.respondWith(
      caches.open(FONTS).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))
      )
    );
    return;
  }

  if (u.origin !== self.location.origin) return;

  // 静的アセットのみキャッシュ。認証 HTML はキャッシュしない
  const isStatic = STATIC.some(p => u.pathname === p || u.pathname.startsWith(p + '?'));
  if (isStatic) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(req).then(hit => hit || fetch(req).then(r => {
          if (r.ok) c.put(req, r.clone());
          return r;
        }))
      )
    );
    return;
  }

  // それ以外は network only（オフラインはエラー）
  e.respondWith(
    fetch(req, { credentials: 'same-origin' })
      .catch(async () => (await caches.match(req)) ?? Response.error())
  );
});
`

app.get('/sw.js', (c) => {
  c.header('Content-Type', 'application/javascript; charset=utf-8')
  c.header('Service-Worker-Allowed', '/')
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  return c.text(SW_JS)
})

// ── 予約送信 cron ─────────────────────────────────────────────

async function processScheduled(env: AppEnv['Bindings']) {
  const due = await env.DB.prepare(
    `SELECT id, from_, to_address, subject, body_text, send_attempts
     FROM emails
     WHERE folder = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?
     LIMIT 50`,
  ).bind(new Date().toISOString()).all<{
    id: string
    from_: string
    to_address: string
    subject: string
    body_text: string
    send_attempts: number
  }>()

  for (const m of due.results ?? []) {
    try {
      await sendEmail(env, {
        from: m.from_,
        to: m.to_address,
        subject: m.subject,
        text: m.body_text,
      })
      await env.DB.prepare(
        `UPDATE emails SET folder = 'sent', scheduled_at = NULL, received_at = ? WHERE id = ?`,
      ).bind(new Date().toISOString(), m.id).run()
    } catch (e) {
      const attempts = (m.send_attempts ?? 0) + 1
      console.error('Scheduled send failed', m.id, attempts, e)
      if (attempts >= 3) {
        await env.DB.prepare(
          `UPDATE emails SET folder = 'failed', send_attempts = ? WHERE id = ?`,
        ).bind(attempts, m.id).run()
      } else {
        await env.DB.prepare(
          `UPDATE emails SET send_attempts = ? WHERE id = ?`,
        ).bind(attempts, m.id).run()
      }
    }
  }
}

export default {
  fetch: app.fetch.bind(app),
  email: emailHandler.email,
  scheduled: async (_ctrl: ScheduledController, env: AppEnv['Bindings']) => {
    await processScheduled(env)
  },
}
