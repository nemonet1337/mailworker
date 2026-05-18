import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { Layout } from './gui/layout'
import { LoginPage } from './gui/login'
import { UsersPage } from './gui/admin/users'
import { AddressesPage } from './gui/admin/addresses'
import { adminMiddleware } from './middleware/admin'
import { authMiddleware } from './middleware/auth'
import { AppEnv } from './types'
import { verifyPassword, hashPassword } from './lib/password'
import { createJwt } from './lib/jwt'

const app = new Hono<AppEnv>()

app.use('*', authMiddleware)
app.use('/admin/*', adminMiddleware)

app.get('/', (c) => {
  const user = c.get('user')
  return c.html(<Layout title="受信箱" user={user} active="inbox"><h1 class="text-xl font-bold">受信箱</h1></Layout>)
})

app.get('/login', (c) => c.html(<LoginPage />))

app.post('/login', async (c) => {
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
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(c.req.param('id')).run()
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
  await c.env.DB.prepare('DELETE FROM mail_addresses WHERE id = ?').bind(c.req.param('id')).run()
  return c.html('')
})

export default app
