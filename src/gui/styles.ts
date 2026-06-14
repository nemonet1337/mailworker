export const CSS = `
:root {
  /* ── Neutral palette ── */
  --ink:        #1f2937;
  --ink-soft:   #374151;
  --sub:        #6b7280;
  --mid:        #9ca3af;
  --line:       #e5e7eb;
  --line-soft:  #f3f4f6;
  --bg:         #f6f8fc;
  --surface:    #ffffff;
  --surface-2:  #f9fafb;

  /* ── Accent (blue) ── */
  --accent:       #1a73e8;
  --accent-soft:  #e8f0fe;
  --accent-deep:  #1557b0;
  --accent-hover: #1669c1;

  /* ── Semantic ── */
  --green:  #188038;
  --amber:  #f29900;
  --red:    #d93025;
  --star:   #f59e0b;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);

  /* ── Radius ── */
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;
  --r-xl: 16px;

  /* ── Typography ── */
  --font:      'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'SF Mono', 'Consolas', Menlo, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
body {
  font-family: var(--font);
  font-size: 14px;
  color: var(--ink);
  background: var(--bg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }

/* ── App shell ─────────────────────────────── */
.app { display: flex; height: 100vh; background: var(--bg); }

/* ── Sidebar ───────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 16px;
}
.brand-mark {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent);
  border-radius: var(--r-md);
  flex-shrink: 0;
}
.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.3px;
  line-height: 1;
}
.brand-text small {
  font-family: var(--font);
  font-size: 10px;
  color: var(--sub);
  display: block;
  letter-spacing: 0.3px;
  font-weight: 400;
  margin-top: 2px;
}

.compose-btn {
  width: calc(100% - 16px);
  margin: 0 8px 12px;
  border: none;
  background: var(--accent);
  color: #fff;
  padding: 10px 16px;
  border-radius: var(--r-xl);
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(26,115,232,.4), 0 1px 2px rgba(26,115,232,.2);
  transition: background 0.15s, box-shadow 0.15s;
  text-decoration: none;
}
.compose-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 2px 6px rgba(26,115,232,.4);
}

.nav-section-label {
  font-size: 10.5px;
  color: var(--sub);
  font-weight: 600;
  padding: 0 14px;
  margin: 12px 0 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex; align-items: center; gap: 6px;
}
.nav-section-label.admin { color: var(--accent); }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13.5px;
  border-radius: var(--r-xl);
  cursor: pointer;
  margin-bottom: 1px;
  color: var(--ink-soft);
  text-decoration: none;
  user-select: none;
  transition: background 0.1s;
  font-weight: 500;
}
.nav-item:hover { background: var(--line-soft); }
.nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-weight: 700;
}
.nav-item-icon { width: 18px; height: 18px; color: var(--sub); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.nav-item.active .nav-item-icon { color: var(--accent); }
.nav-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-item-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--surface);
  background: var(--accent);
  border-radius: 10px;
  padding: 1px 6px;
  min-width: 20px;
  text-align: center;
}

.address-dot { width: 8px; height: 8px; border-radius: 4px; background: var(--accent); flex-shrink: 0; }
.address-dot.muted { background: var(--mid); }

.sidebar-addr-list { padding: 0; }

.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 4px;
}
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.avatar.lg { width: 38px; height: 38px; font-size: 13px; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-email { font-size: 11px; color: var(--sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.icon-btn {
  width: 32px; height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--sub);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
  padding: 0;
}
.icon-btn:hover { background: var(--line-soft); color: var(--ink); }

/* ── Main area ─────────────────────────────── */
.main { flex: 1; display: flex; min-width: 0; }

/* ── Mail list pane ────────────────────────── */
.list-pane {
  width: 320px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
.list-header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.list-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.list-title { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.3px; }
.list-count {
  font-size: 11.5px;
  color: var(--accent);
  font-weight: 700;
  background: var(--accent-soft);
  padding: 2px 8px;
  border-radius: 10px;
}

.search-input {
  width: 100%;
  border: none;
  background: var(--bg);
  border-radius: var(--r-xl);
  padding: 8px 14px 8px 36px;
  font-size: 13px;
  color: var(--ink);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/></svg>");
  background-repeat: no-repeat;
  background-position: 12px center;
  outline: none;
  transition: background 0.15s, box-shadow 0.15s;
}
.search-input:focus { background-color: var(--surface); box-shadow: 0 0 0 2px var(--accent); }
.search-input::placeholder { color: var(--mid); }

.list-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }

.mail-row {
  padding: 12px 16px;
  border-bottom: 1px solid var(--line-soft);
  cursor: pointer;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: background 0.08s;
  position: relative;
}
.mail-row:hover { background: var(--bg); }
.mail-row.active { background: var(--accent-soft); }
.mail-row.unread { background: var(--surface); }
.mail-row.unread .mail-from { font-weight: 700; }
.mail-row.unread .mail-subject { font-weight: 600; }

.mail-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.mail-row:nth-child(3n+1) .mail-avatar { background: #1a73e8; }
.mail-row:nth-child(3n+2) .mail-avatar { background: #188038; }
.mail-row:nth-child(3n+3) .mail-avatar { background: #9334e6; }

.mail-content { flex: 1; min-width: 0; }
.mail-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; margin-bottom: 3px; }
.mail-from { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); }
.mail-time { font-size: 11.5px; color: var(--sub); flex-shrink: 0; }
.mail-subject { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-soft); margin-bottom: 1px; }
.mail-preview { font-size: 12px; color: var(--mid); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 4px; }

/* ── Read pane ──────────────────────────────── */
.read-pane { flex: 1; display: flex; flex-direction: column; background: var(--surface); min-width: 0; }
.read-toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  background: var(--surface);
}
.tool-btn {
  padding: 6px 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--r-md);
  font-size: 12.5px;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.1s, border-color 0.1s, box-shadow 0.1s;
  cursor: pointer;
  font-weight: 500;
}
.tool-btn:hover { background: var(--bg); border-color: var(--mid); box-shadow: var(--shadow-sm); }
.tool-btn.icon-only { padding: 6px 8px; }
.tool-btn.danger:hover { border-color: var(--red); color: var(--red); background: #fef2f2; }
.tool-btn[style*="#f59e0b"] { color: var(--star) !important; }

.read-body { padding: 24px 32px; overflow-y: auto; flex: 1; max-width: 860px; }
.read-subject { font-size: 22px; font-weight: 700; margin-bottom: 16px; line-height: 1.3; color: var(--ink); letter-spacing: -0.3px; }
.read-header { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.read-from { font-size: 13.5px; color: var(--ink); }
.read-from b { font-weight: 600; }
.read-from .addr { color: var(--sub); font-size: 12.5px; margin-left: 6px; }
.read-time { font-size: 12px; color: var(--sub); margin-left: auto; white-space: nowrap; }

.read-content { font-size: 14px; line-height: 1.75; color: var(--ink); }
.read-content p { margin: 0 0 12px; }

.attachment {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  font-size: 12.5px;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.1s, background 0.1s;
  font-weight: 500;
}
.attachment:hover { border-color: var(--accent); background: var(--accent-soft); }
.attachment-icon { color: var(--accent); }
.attachment-size { color: var(--sub); font-size: 11.5px; }

/* ── Tags / badges ──────────────────────────── */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  background: var(--bg);
  color: var(--ink-soft);
  font-weight: 500;
}

/* ── Compose drawer ─────────────────────────── */
.compose-drawer {
  position: fixed;
  right: 24px;
  bottom: 0;
  width: 540px;
  max-width: calc(100vw - 48px);
  background: var(--surface);
  border: none;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  box-shadow: 0 8px 40px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.1);
  display: flex;
  flex-direction: column;
  z-index: 50;
  animation: slideUp 0.22s cubic-bezier(0.2, 0.8, 0.3, 1);
  max-height: 80vh;
}
.compose-drawer.minimized { max-height: 52px; }
.compose-drawer.minimized .compose-body,
.compose-drawer.minimized .compose-toolbar { display: none; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.compose-header {
  padding: 14px 16px;
  background: var(--ink);
  color: #fff;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}
.compose-title { flex: 1; font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.compose-header-actions { display: flex; gap: 2px; }
.compose-header-actions .icon-btn { color: rgba(255,255,255,.65); width: 24px; height: 24px; border-radius: 50%; }
.compose-header-actions .icon-btn:hover { background: rgba(255,255,255,.15); color: #fff; }

.compose-body { flex: 1; overflow-y: auto; padding: 0 16px; display: flex; flex-direction: column; }
.compose-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.compose-row label { font-size: 12px; color: var(--sub); width: 40px; flex-shrink: 0; font-weight: 500; }
.compose-row input, .compose-row textarea, .compose-row select {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--ink);
  background: transparent;
  resize: none;
  padding: 0;
}
.compose-row input::placeholder, .compose-row textarea::placeholder { color: var(--mid); }

.compose-textarea {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  padding: 14px 0;
  min-height: 160px;
  background: transparent;
  width: 100%;
  color: var(--ink);
}

.compose-toolbar {
  padding: 10px 16px;
  border-top: 1px solid var(--line);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-primary {
  padding: 8px 20px;
  border: none;
  background: var(--accent);
  color: #fff;
  border-radius: var(--r-xl);
  font-size: 13.5px;
  font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 1px 3px rgba(26,115,232,.35);
  transition: background 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); box-shadow: 0 2px 6px rgba(26,115,232,.4); }
.btn-primary:active { background: var(--accent-deep); }
.btn-primary:disabled { background: var(--mid); cursor: not-allowed; box-shadow: none; }

.compose-save { font-size: 11.5px; color: var(--sub); margin-left: auto; }

/* ── Toasts ─────────────────────────────────── */
.toast-container {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
  align-items: center;
}
.toast {
  background: var(--ink);
  color: #fff;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 420px;
  pointer-events: auto;
  animation: toastIn 0.28s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.toast.exit { animation: toastOut 0.2s forwards; }
.toast.error { background: var(--red); }
.toast.success { background: var(--ink); }
@keyframes toastIn { from { transform: translateY(20px); opacity: 0; } }
@keyframes toastOut { to { transform: translateY(20px); opacity: 0; } }

.toast-icon {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,.2);
  font-size: 12px;
  font-weight: 700;
}
.toast-content { flex: 1; min-width: 0; }
.toast-title { font-size: 13.5px; font-weight: 600; }
.toast-desc { font-size: 12px; opacity: 0.75; margin-top: 1px; }
.toast-close { font-size: 18px; color: rgba(255,255,255,.7); cursor: pointer; padding: 0 2px; background: transparent; border: none; line-height: 1; }
.toast-close:hover { color: #fff; }

/* ── Login screen ───────────────────────────── */
.login-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 40px;
}
.login-card {
  width: 400px;
  max-width: 100%;
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  padding: 40px;
}
.login-mark { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.login-mark .brand-mark { width: 40px; height: 40px; border-radius: var(--r-lg); }
.login-mark .brand-text { font-size: 22px; }
.login-greeting { margin-bottom: 28px; }
.login-greeting h1 { font-size: 26px; font-weight: 700; margin: 0; line-height: 1.2; color: var(--ink); letter-spacing: -0.5px; }
.login-greeting p { font-size: 14px; color: var(--sub); margin: 6px 0 0; }
.login-field { margin-bottom: 18px; }
.login-field label {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  font-weight: 500;
  margin-bottom: 6px;
}
.login-field .underline-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 14px;
  font-size: 14px;
  background: var(--surface);
  outline: none;
  color: var(--ink);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.login-field .underline-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,115,232,.12); }
.login-field .underline-input::placeholder { color: var(--mid); }

.login-cta {
  width: 100%;
  background: var(--accent);
  border: none;
  padding: 11px 20px;
  margin-top: 8px;
  font-size: 14.5px;
  font-weight: 600;
  color: #fff;
  border-radius: var(--r-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(26,115,232,.35);
}
.login-cta:hover { background: var(--accent-hover); box-shadow: 0 2px 6px rgba(26,115,232,.4); }
.login-cta:disabled { background: var(--mid); cursor: not-allowed; box-shadow: none; }

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 11px;
  color: var(--sub);
}
.login-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid var(--red);
  padding: 10px 14px;
  border-radius: var(--r-md);
  margin-bottom: 18px;
  display: flex; gap: 10px; align-items: flex-start;
  animation: shake 0.3s;
}
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.login-error-icon { color: var(--red); flex-shrink: 0; font-weight: 700; font-size: 14px; margin-top: 1px; }
.login-error-body { font-size: 13px; }
.login-error-body b { font-weight: 600; color: var(--ink); }
.login-error-body div { color: var(--sub); font-size: 12px; margin-top: 2px; }

/* ── Page header (admin screens) ────────────── */
.page { flex: 1; overflow-y: auto; padding: 0; background: var(--bg); }
.page-inner { padding: 28px 36px; max-width: 1200px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 26px; font-weight: 700; line-height: 1; margin: 0 0 4px; letter-spacing: -0.5px; }
.page-subtitle { font-size: 13.5px; color: var(--sub); }
.page-actions { display: flex; gap: 8px; align-items: center; }

.btn-ghost {
  padding: 8px 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--r-md);
  font-size: 13px;
  color: var(--ink-soft);
  display: inline-flex; align-items: center; gap: 6px;
  transition: border-color 0.1s, background 0.1s;
  cursor: pointer;
  font-weight: 500;
}
.btn-ghost:hover { border-color: var(--mid); background: var(--bg); }

.btn-secondary {
  padding: 8px 14px;
  border: 1px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent-deep);
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  cursor: pointer;
  transition: background 0.1s;
}
.btn-secondary:hover { background: #d2e3fc; }

/* ── Filter pills ───────────────────────────── */
.filter-row { display: flex; gap: 10px; margin-bottom: 18px; align-items: center; flex-wrap: wrap; }
.filter-search { flex: 1; max-width: 340px; }
.pill {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 12.5px;
  color: var(--ink-soft);
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.1s;
}
.pill:hover { border-color: var(--accent); color: var(--accent); }
.pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* ── Table ──────────────────────────────────── */
.table-wrap { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
table.dt { width: 100%; border-collapse: collapse; }
.dt thead th {
  text-align: left;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  color: var(--sub);
  padding: 12px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
.dt tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 13.5px;
  vertical-align: middle;
}
.dt tbody tr:last-child td { border-bottom: none; }
.dt tbody tr { transition: background 0.08s; }
.dt tbody tr:hover { background: var(--bg); }
.dt .col-actions { width: 80px; text-align: right; }
.link { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font-weight: 500; }

/* ── Address cards ──────────────────────────── */
.address-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.address-card:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); }
.address-card.expanded { border: 1.5px solid var(--accent); box-shadow: var(--shadow-md); display: block; padding: 0; cursor: default; }

.address-icon {
  width: 40px; height: 40px;
  border-radius: var(--r-md);
  background: var(--accent-soft);
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
}
.address-card.expanded .address-icon-row .address-icon { background: var(--accent); color: #fff; border-color: var(--accent-deep); }
.address-info { flex: 1; min-width: 0; }
.address-addr { font-family: var(--font-mono); font-size: 13.5px; font-weight: 600; }
.address-addr .domain { font-weight: 400; color: var(--sub); }
.address-desc { font-size: 12px; color: var(--sub); margin-top: 2px; }
.address-state { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-soft); }

.address-icon-row { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid var(--line); }
.address-detail { padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-label {
  font-size: 11px;
  color: var(--sub);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  margin-bottom: 6px;
}

/* ── Confirm dialog ─────────────────────────── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.4);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.15s;
}
@keyframes fadeIn { from { opacity: 0; } }
.dialog {
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-lg);
  width: 400px;
  max-width: calc(100vw - 48px);
  padding: 28px;
}
.dialog h3 { font-size: 17px; font-weight: 700; margin: 0 0 8px; }
.dialog p { font-size: 13.5px; color: var(--sub); margin: 0 0 24px; line-height: 1.5; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-danger {
  padding: 8px 18px;
  border: none;
  background: var(--red);
  color: #fff;
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-danger:hover { background: #b52d22; }

/* ── Empty / placeholder ────────────────────── */
.empty-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--mid);
  font-size: 13.5px;
  gap: 10px;
  padding: 40px;
  text-align: center;
}
.empty-pane .big { font-size: 22px; font-weight: 700; color: var(--mid); margin-top: 4px; }

/* ── Dashboard KPI ──────────────────────────── */
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
@media (min-width: 1100px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
.kpi-tile {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 20px;
  transition: box-shadow 0.12s;
}
.kpi-tile:hover { box-shadow: var(--shadow-md); }
.kpi-label { font-size: 12px; color: var(--sub); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
.kpi-value { font-size: 36px; font-weight: 800; line-height: 1; color: var(--accent); letter-spacing: -1px; }
.kpi-sub { font-size: 11px; color: var(--sub); margin-top: 4px; }

.section-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
  margin-bottom: 16px;
}
.section-card-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg);
}
.section-card-title { font-size: 14px; font-weight: 700; color: var(--ink); }
.section-card-sub { font-size: 12px; color: var(--sub); }

.addr-bar-row { display: flex; align-items: center; gap: 12px; padding: 8px 20px; }
.addr-bar-label { width: 140px; font-family: var(--font-mono); font-size: 12.5px; font-weight: 500; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addr-bar-track { flex: 1; height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.addr-bar-fill { height: 100%; background: var(--accent); border-radius: 3px; }
.addr-bar-count { width: 50px; text-align: right; font-size: 13px; font-weight: 600; color: var(--ink); flex-shrink: 0; }

/* ── Misc ───────────────────────────────────── */
.divider { height: 1px; background: var(--line); margin: 14px 0; }
.fade { animation: fade 0.18s; }
@keyframes fade { from { opacity: 0; } }

/* ── Form fields ────────────────────────────── */
.form-field { margin-bottom: 16px; }
.form-label { display: block; font-size: 12px; color: var(--ink-soft); font-weight: 500; margin-bottom: 6px; }
.form-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 9px 12px;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--surface);
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(26,115,232,.1); }
.form-input::placeholder { color: var(--mid); }
.form-select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%236b7280' d='M0 0h12L6 8z'/></svg>"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; }

/* ── Scrollbars ─────────────────────────────── */
.list-scroll::-webkit-scrollbar { width: 6px; }
.list-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
.page::-webkit-scrollbar { width: 8px; }
.page::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.read-body::-webkit-scrollbar { width: 8px; }
.read-body::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--line); border-radius: 2px; }

/* ── Read pane back button (desktop: hidden) ── */
.read-back-btn { display: none; }

/* ── Mobile navigation bar ──────────────────── */
.mobile-nav { display: none; }

/* ── Mobile layout ──────────────────────────── */
@media (max-width: 767px) {
  .sidebar { display: none; }

  .mobile-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 56px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: var(--surface);
    border-top: 1px solid var(--line);
    z-index: 40;
    align-items: center;
    justify-content: space-around;
  }

  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex: 1;
    height: 100%;
    color: var(--sub);
    text-decoration: none;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: none;
    padding: 4px 0 0;
    transition: color 0.12s;
  }
  .mobile-nav-item.active { color: var(--accent); }

  .app {
    height: calc(100dvh - 56px - env(safe-area-inset-bottom, 0px));
    flex-direction: column;
  }

  .main {
    position: relative;
    overflow: hidden;
    flex: 1;
  }

  .list-pane {
    width: 100%;
    position: absolute;
    inset: 0;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s;
    z-index: 1;
  }

  .main.show-detail .list-pane {
    transform: translateX(-20%);
    opacity: 0.3;
    pointer-events: none;
  }

  .read-pane {
    position: absolute;
    inset: 0;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 2;
    background: var(--surface);
  }

  .main.show-detail .read-pane {
    transform: translateX(0);
  }

  .read-back-btn { display: flex; }

  .read-toolbar { padding: 10px 12px; gap: 4px; }
  .read-body { padding: 16px; max-width: 100%; }
  .read-subject { font-size: 18px; }

  .compose-drawer {
    right: 0; left: 0;
    width: 100%; max-width: 100%;
    max-height: 92dvh;
    border-radius: var(--r-lg) var(--r-lg) 0 0;
  }

  .toast-container {
    left: 12px; right: 12px;
    bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    transform: none;
    align-items: stretch;
  }
  .toast { min-width: 0; max-width: 100%; }

  .page-inner { padding: 20px 16px; }
  .page-title { font-size: 22px; }
  .page-header { margin-bottom: 16px; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }

  .list-header { padding: 12px 14px 10px; }
  .list-title { font-size: 18px; }
  .mail-row { padding: 10px 14px; }

  .login-screen {
    padding: 20px 16px;
    min-height: 100dvh;
  }
  .login-card {
    padding: 28px 24px;
  }
}
`
