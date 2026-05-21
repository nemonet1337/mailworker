import { FC } from 'hono/jsx'
import { SessionUser } from '../types'

type LayoutProps = {
  title: string
  active?: 'inbox' | 'compose' | 'users' | 'addresses' | 'settings'
  user?: SessionUser
  children: unknown
}

const activeClass = 'text-blue-600 font-semibold'

const toastScript = `
(function () {
  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    var bg = type === 'success' ? 'bg-green-600'
           : type === 'error'   ? 'bg-red-600'
           : 'bg-blue-600';
    toast.className = bg + ' text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs pointer-events-auto transition-all duration-300 opacity-0 translate-y-2';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.remove('opacity-0', 'translate-y-2');
    });
    setTimeout(function () {
      toast.classList.add('opacity-0');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  // HTMX の HX-Trigger: {"showToast": {...}} を受け取る
  document.body.addEventListener('showToast', function (evt) {
    showToast(evt.detail.message, evt.detail.type);
  });

  // ログイン成功など、リダイレクト前に sessionStorage に保存したフラッシュを表示
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var raw = sessionStorage.getItem('__flash');
      if (raw) {
        sessionStorage.removeItem('__flash');
        var data = JSON.parse(raw);
        if (data && data.msg) showToast(data.msg, data.type || 'success');
      }
    } catch (_) {}
  });

  window.__showToast = showToast;
})();
`

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
      {/* トースト通知コンテナ */}
      <div
        id="toast-container"
        class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      />

      {user && (
        <header class="bg-white border-b">
          <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <nav class="flex items-center gap-5 text-sm">
              <a href="/" class="font-bold text-base">Mail</a>
              <a href="/" class={active === 'inbox' ? activeClass : ''}>受信箱</a>
              <a href="/compose" class={active === 'compose' ? activeClass : ''}>作成</a>
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

      {/* トースト JS (インライン) */}
      <script dangerouslySetInnerHTML={{ __html: toastScript }} />
    </body>
  </html>
)
