import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJwt } from '../lib/jwt'
import { AppEnv } from '../types'

const PUBLIC_PATHS = new Set(['/login'])

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  if (PUBLIC_PATHS.has(c.req.path)) return next()

  const token = getCookie(c, 'session')
  if (!token) return c.redirect('/login')

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload) return c.redirect('/login')

  const user = await c.env.DB.prepare('SELECT id, email, display_name, is_admin FROM users WHERE id = ?').bind(payload.sub).first()
  if (!user) return c.redirect('/login')

  c.set('user', user as AppEnv['Variables']['user'])
  c.set('isAuthed', true)
  await next()
}
