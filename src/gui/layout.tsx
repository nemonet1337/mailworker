import { FC } from 'hono/jsx'
import { SessionUser } from '../types'
import { CSS } from './styles'
import { Icon, LogoMark } from './icons'

type ActivePage = 'inbox' | 'users' | 'addresses' | 'dashboard' | 'settings'

type LayoutProps = {
  title: string
  active?: ActivePage
  user?: SessionUser
  children: unknown
}

const toastScript = `
(function () {
  function showToast(message, type, desc) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var iconHtml = type === 'success' ? '✓' : type === 'error' ? '!' : '↻';
    toast.innerHTML =
      '<div class="toast-icon">' + iconHtml + '</div>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + message + '</div>' +
        (desc ? '<div class="toast-desc">' + desc + '</div>' : '') +
      '</div>' +
      '<button class="toast-close" onclick="this.closest(\\'.toast\\').remove()">\xd7</button>';
    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('exit');
      setTimeout(function () { toast.remove(); }, 200);
    }, 4000);
  }

  document.body.addEventListener('showToast', function (evt) {
    showToast(evt.detail.message, evt.detail.type, evt.detail.desc);
  });

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

const Sidebar: FC<{ user: SessionUser; active?: ActivePage }> = ({ user, active }) => (
  <aside class="sidebar">
    <div class="brand">
      <LogoMark size={28} />
      <div class="brand-text">
        WorkerMail
        <small>nemonet.work</small>
      </div>
    </div>

    <button
      class="compose-btn"
      hx-get="/compose/drawer"
      hx-target="#compose-slot"
      hx-swap="innerHTML"
    >
      <Icon name="plus" size={16} strokeWidth={2.2} /> 作成 / Compose
    </button>

    <div class="nav-section-label">メール</div>

    <a href="/" class={`nav-item${active === 'inbox' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="inbox" size={16} />
      </span>
      <span class="nav-item-label">受信箱</span>
      <span
        class="nav-item-count"
        hx-get="/sidebar/unread"
        hx-trigger="load, every 30s"
        hx-target="this"
        hx-swap="innerHTML"
      />
    </a>

    <div
      class="nav-section-label"
      style="cursor:default"
      hx-get="/sidebar/addresses"
      hx-trigger="load"
      hx-target="next .sidebar-addr-list"
      hx-swap="innerHTML"
    >
      アドレス
    </div>
    <div class="sidebar-addr-list" />

    {user.is_admin === 1 && (
      <>
        <div class="nav-section-label admin">
          <Icon name="crown" size={11} strokeWidth={2.2} />
          <span>管理 · admin only</span>
        </div>
        <a href="/admin/dashboard" class={`nav-item${active === 'dashboard' ? ' active' : ''}`}>
          <span class="nav-item-icon">
            <Icon name="shield" size={16} />
          </span>
          <span class="nav-item-label">ダッシュボード</span>
        </a>
        <a href="/admin/users" class={`nav-item${active === 'users' ? ' active' : ''}`}>
          <span class="nav-item-icon">
            <Icon name="users" size={16} />
          </span>
          <span class="nav-item-label">ユーザー</span>
        </a>
        <a href="/admin/addresses" class={`nav-item${active === 'addresses' ? ' active' : ''}`}>
          <span class="nav-item-icon">
            <Icon name="at" size={16} />
          </span>
          <span class="nav-item-label">アドレス</span>
        </a>
      </>
    )}

    <div class="sidebar-footer">
      <div class="avatar">{initials(user.display_name)}</div>
      <div class="user-info">
        <div class="user-name" style="display:flex;align-items:center;gap:4px">
          {user.display_name}
          {user.is_admin === 1 && (
            <Icon name="crown" size={11} stroke="var(--coral)" strokeWidth={2.2} />
          )}
        </div>
        <div class="user-email">{user.email}</div>
      </div>
      <form hx-post="/logout" hx-swap="none">
        <button class="icon-btn" type="submit" title="ログアウト">
          <Icon name="x" size={16} />
        </button>
      </form>
    </div>
  </aside>
)

export const SidebarAddressItems: FC<{ addresses: string[] }> = ({ addresses }) => (
  <>
    {addresses.map((addr) => (
      <a key={addr} href={`/?addr=${encodeURIComponent(addr)}`} class="nav-item">
        <span class="address-dot" />
        <span class="nav-item-label" style="font-family:var(--font-mono)">
          {addr}
        </span>
      </a>
    ))}
  </>
)

export const Layout: FC<LayoutProps> = ({ title, active, user, children }) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title} — WorkerMail</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script src="https://unpkg.com/htmx.org@1.9.12" />
    </head>
    <body>
      <div class="app">
        {user ? <Sidebar user={user} active={active} /> : null}
        <div class="main">{children as any}</div>
      </div>

      <div id="compose-slot" />
      <div class="toast-container" id="toast-container" aria-live="polite" />

      <script dangerouslySetInnerHTML={{ __html: toastScript }} />
    </body>
  </html>
)

export const LoginLayout: FC<{ title: string; children: unknown }> = ({ title, children }) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title} — WorkerMail</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script src="https://unpkg.com/htmx.org@1.9.12" />
    </head>
    <body style="overflow:auto">
      {children as any}
      <div class="toast-container" id="toast-container" aria-live="polite" />
    </body>
  </html>
)
