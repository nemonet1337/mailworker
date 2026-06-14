import { FC } from 'hono/jsx'
import { SessionUser } from '../types'
import { CSS } from './styles'
import { Icon, LogoMark } from './icons'

type ActivePage = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'starred' | 'users' | 'addresses' | 'dashboard' | 'settings'

type LayoutProps = {
  title: string
  active?: ActivePage
  user?: SessionUser
  children: unknown
}

const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`

const themeInitScript = `(function(){var t=localStorage.getItem('wm-theme')||'system';var a=localStorage.getItem('wm-accent')||'blue';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.setAttribute('data-theme','dark');if(a&&a!=='blue')document.documentElement.setAttribute('data-accent',a);})();`

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

const MobileNav: FC<{ user: SessionUser; active?: ActivePage }> = ({ user, active }) => (
  <nav class="mobile-nav">
    <a href="/" class={`mobile-nav-item${active === 'inbox' ? ' active' : ''}`}>
      <Icon name="inbox" size={22} />
      <span>受信箱</span>
    </a>
    <button
      class="mobile-nav-item"
      hx-get="/compose/drawer"
      hx-target="#compose-slot"
      hx-swap="innerHTML"
    >
      <Icon name="plus" size={22} strokeWidth={2.2} />
      <span>作成</span>
    </button>
    <a href="/settings" class={`mobile-nav-item${active === 'settings' ? ' active' : ''}`}>
      <Icon name="settings" size={22} />
      <span>設定</span>
    </a>
    <div
      class="mobile-nav-item"
      style="position:relative"
      onclick="var m=document.getElementById('mobile-user-menu');m.style.display=m.style.display==='block'?'none':'block'"
    >
      <div class="avatar" style="width:24px;height:24px;font-size:9px;border-radius:12px;flex-shrink:0">{initials(user.display_name)}</div>
      <span>アカウント</span>
      <div
        id="mobile-user-menu"
        style="display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--white);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow-lg);overflow:hidden;z-index:100;white-space:nowrap;min-width:160px"
        onclick="event.stopPropagation()"
      >
        <form hx-post="/logout" hx-swap="none">
          <button
            type="submit"
            style="width:100%;display:flex;align-items:center;gap:8px;padding:12px 16px;border:none;background:none;cursor:pointer;font-size:13.5px;color:var(--ink);text-align:left"
          >
            <Icon name="arrowLeft" size={14} />
            ログアウト
          </button>
        </form>
      </div>
    </div>
  </nav>
)

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

    <a href="/starred" class={`nav-item${active === 'starred' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="star" size={16} />
      </span>
      <span class="nav-item-label">お気に入り</span>
    </a>

    <a href="/sent" class={`nav-item${active === 'sent' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="send" size={16} />
      </span>
      <span class="nav-item-label">送信済み</span>
    </a>

    <a href="/drafts" class={`nav-item${active === 'drafts' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="drafts" size={16} />
      </span>
      <span class="nav-item-label">下書き</span>
    </a>

    <a href="/spam" class={`nav-item${active === 'spam' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="alert" size={16} />
      </span>
      <span class="nav-item-label">スパム</span>
    </a>

    <a href="/trash" class={`nav-item${active === 'trash' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="trash" size={16} />
      </span>
      <span class="nav-item-label">ゴミ箱</span>
    </a>

    <a href="/settings" class={`nav-item${active === 'settings' ? ' active' : ''}`}>
      <span class="nav-item-icon">
        <Icon name="settings" size={16} />
      </span>
      <span class="nav-item-label">設定</span>
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

    <div
      class="sidebar-footer"
      style="cursor:pointer;position:relative"
      onclick="var m=document.getElementById('user-menu');m.style.display=m.style.display==='block'?'none':'block'"
    >
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
      <div
        id="user-menu"
        style="display:none;position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--bg);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);overflow:hidden;z-index:100"
        onclick="event.stopPropagation()"
      >
        <form hx-post="/logout" hx-swap="none">
          <button
            type="submit"
            style="width:100%;display:flex;align-items:center;gap:8px;padding:12px 16px;border:none;background:none;cursor:pointer;font-size:13.5px;color:var(--text);text-align:left"
            onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background='none'"
          >
            <Icon name="log-out" size={14} />
            ログアウト
          </button>
        </form>
      </div>
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
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>{title} — WorkerMail</title>
      <meta name="theme-color" content="#1f1a16" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="WorkerMail" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon.svg" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script src="https://unpkg.com/htmx.org@1.9.12" />
    </head>
    <body>
      <div class="app">
        {user ? <Sidebar user={user} active={active} /> : null}
        <div class="main" id="main-area">{children as any}</div>
      </div>

      {user ? <MobileNav user={user} active={active} /> : null}
      <div id="compose-slot" />
      <div class="toast-container" id="toast-container" aria-live="polite" />

      <script dangerouslySetInnerHTML={{ __html: toastScript }} />
      <script dangerouslySetInnerHTML={{ __html: `document.addEventListener('click',function(e){var m=document.getElementById('user-menu');if(m&&m.closest('.sidebar-footer')&&!m.closest('.sidebar-footer').contains(e.target))m.style.display='none';var mm=document.getElementById('mobile-user-menu');if(mm&&!e.target.closest('.mobile-nav-item'))mm.style.display='none'})` }} />
      <script dangerouslySetInnerHTML={{ __html: swScript }} />
    </body>
  </html>
)

export const LoginLayout: FC<{ title: string; children: unknown }> = ({ title, children }) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>{title} — WorkerMail</title>
      <meta name="theme-color" content="#1f1a16" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="WorkerMail" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon.svg" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script src="https://unpkg.com/htmx.org@1.9.12" />
    </head>
    <body style="overflow:auto">
      {children as any}
      <div class="toast-container" id="toast-container" aria-live="polite" />
      <script dangerouslySetInnerHTML={{ __html: swScript }} />
    </body>
  </html>
)
