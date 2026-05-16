import { Context, Next } from 'hono'
import { AppEnv } from '../types'

export async function adminMiddleware(c: Context<AppEnv>, next: Next) {
  const user = c.get('user')
  if (!user || user.is_admin !== 1) {
    return c.html('<h1>403 Forbidden</h1><p>管理者のみアクセス可能です。</p>', 403)
  }
  await next()
}
