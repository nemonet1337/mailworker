import { Context, Next } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { verifyJwt, createJwt } from '../lib/jwt'
import { AppEnv } from '../types'

const SESSION_DURATION = 30 * 24 * 60 * 60  // 30 days in seconds
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60  // refresh when < 7 days remaining

const PUBLIC_PATHS = new Set(['/login', '/setup'])

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  // ユーザーが存在しない場合はセットアップ画面へ
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>()
  if ((userCount?.cnt ?? 0) === 0) {
    if (c.req.path === '/setup') return next()
    return c.redirect('/setup')
  }

  if (PUBLIC_PATHS.has(c.req.path)) return next()

  const token = getCookie(c, 'session')
  if (!token) return c.redirect('/login')

  let payload = null
  try {
    payload = await verifyJwt(token, c.env.JWT_SECRET)
  } catch {
    // malformed token or crypto error — treat as unauthenticated
  }
  if (!payload) return c.redirect('/login')

  const user = await c.env.DB.prepare('SELECT id, email, display_name, is_admin FROM users WHERE id = ?').bind(payload.sub).first()
  if (!user) return c.redirect('/login')

  c.set('user', user as AppEnv['Variables']['user'])
  c.set('isAuthed', true)

  // Sliding window: refresh the cookie when less than REFRESH_THRESHOLD seconds remain
  const now = Math.floor(Date.now() / 1000)
  if (c.env.JWT_SECRET && payload.exp - now < REFRESH_THRESHOLD) {
    const newExp = now + SESSION_DURATION
    const newToken = await createJwt({ sub: payload.sub, is_admin: payload.is_admin, exp: newExp }, c.env.JWT_SECRET)
    setCookie(c, 'session', newToken, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: SESSION_DURATION })
  }

  await next()
}
