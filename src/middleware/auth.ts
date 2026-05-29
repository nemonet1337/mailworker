import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJwt } from '../lib/jwt'
import { AppEnv } from '../types'

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

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload) return c.redirect('/login')

  const user = await c.env.DB.prepare('SELECT id, email, display_name, is_admin FROM users WHERE id = ?').bind(payload.sub).first()
  if (!user) return c.redirect('/login')

  c.set('user', user as AppEnv['Variables']['user'])
  c.set('isAuthed', true)
  await next()
}
