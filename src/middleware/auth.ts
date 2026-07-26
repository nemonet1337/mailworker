import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJwt } from '../lib/jwt'
import { AppEnv } from '../types'

const PUBLIC_PATHS = new Set([
  '/login',
  '/setup',
  '/manifest.json',
  '/sw.js',
  '/icon.svg',
  '/icon-maskable.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/app.css',
  '/htmx.min.js',
])

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  if (PUBLIC_PATHS.has(c.req.path)) return next()

  const token = getCookie(c, 'session')
  if (token) {
    let payload = null
    try {
      payload = await verifyJwt(token, c.env.JWT_SECRET)
    } catch {
      // malformed token or crypto error
    }
    if (payload) {
      const user = await c.env.DB.prepare(
        'SELECT id, email, display_name, is_admin FROM users WHERE id = ?'
      ).bind(payload.sub).first()
      if (user) {
        c.set('user', user as AppEnv['Variables']['user'])
        await next()
        return
      }
    }
    return c.redirect('/login')
  }

  // Cookie 無しのときだけセットアップ判定 (D1 COUNT を静的アセットに走らせない)
  const userCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>()
  if ((userCount?.cnt ?? 0) === 0) {
    return c.redirect('/setup')
  }
  return c.redirect('/login')
}
