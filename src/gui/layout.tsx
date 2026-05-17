import { FC } from 'hono/jsx'
import { SessionUser } from '../types'

type LayoutProps = {
  title: string
  active?: 'inbox' | 'users' | 'addresses' | 'settings'
  user?: SessionUser
  children: unknown
}

const activeClass = 'text-blue-600 font-semibold'

export const Layout: FC<LayoutProps> = ({ title, active, user, children }) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/htmx.org@1.9.12"></script>
    </head>
    <body class="bg-gray-100 min-h-screen text-gray-900">
      {user && (
        <header class="bg-white border-b">
          <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <nav class="flex items-center gap-5 text-sm">
              <a href="/" class="font-bold text-base">Mail</a>
              <a href="/" class={active === 'inbox' ? activeClass : ''}>受信箱</a>
              <a href="/settings" class={active === 'settings' ? activeClass : ''}>設定</a>
              {user.is_admin === 1 && (
                <div class="flex items-center gap-3">
                  <span>管理</span>
                  <a href="/admin/users" class={active === 'users' ? activeClass : ''}>ユーザー管理</a>
                  <a href="/admin/addresses" class={active === 'addresses' ? activeClass : ''}>メールアドレス管理</a>
                </div>
              )}
            </nav>
            <form hx-post="/logout" hx-swap="none">
              <button class="text-sm px-3 py-2 bg-gray-200 rounded">ログアウト</button>
            </form>
          </div>
        </header>
      )}
      <main class="max-w-5xl mx-auto p-4">{children}</main>
    </body>
  </html>
)
