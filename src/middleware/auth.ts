import { Context, Next } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { verifyJwt, createJwt } from '../lib/jwt'
import { AppEnv } from '../types'

const SESSION_DURATION = 30 * 24 * 60 * 60  // 30 days in seconds
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60  // refresh when < 7 days remaining

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

        // Sliding window: refresh when less than REFRESH_THRESHOLD remains
        const now = Math.floor(Date.now() / 1000)
        if (c.env.JWT_SECRET && payload.exp - now < REFRESH_THRESHOLD) {
          const newExp = now + SESSION_DURATION
          const newToken = await createJwt(
            { sub: payload.sub, is_admin: payload.is_admin, exp: newExp },
            c.env.JWT_SECRET,
          )
          setCookie(c, 'session', newToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: SESSION_DURATION,
          })
        }

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
