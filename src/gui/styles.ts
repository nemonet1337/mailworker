export const CSS = `
:root {
  --ink: #1f1a16;
  --ink-soft: #3a322a;
  --sub: #8a8276;
  --mid: #b8b0a4;
  --line: #e4ddd1;
  --line-soft: #efe9dd;
  --paper: #fbf8f3;
  --paper-2: #f5f1e8;
  --white: #ffffff;
  --coral: oklch(0.62 0.13 30);
  --coral-soft: oklch(0.94 0.035 30);
  --coral-deep: oklch(0.52 0.14 30);
  --green: oklch(0.62 0.12 150);
  --amber: oklch(0.72 0.13 70);
  --red: oklch(0.6 0.18 25);
  --shadow-sm: 0 1px 0 rgba(31,26,22,0.04), 0 1px 2px rgba(31,26,22,0.06);
  --shadow-md: 0 4px 12px rgba(31,26,22,0.08), 0 1px 2px rgba(31,26,22,0.06);
  --shadow-lg: 0 12px 32px rgba(31,26,22,0.14), 0 2px 6px rgba(31,26,22,0.08);
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --font: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-hand: 'Caveat', 'Kalam', cursive;
  --font-mono: ui-monospace, 'SF Mono', Menlo, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
body {
  font-family: var(--font);
  font-size: 14px;
  color: var(--ink);
  background: var(--paper);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }

/* ── App shell ───────────────────────────── */
.app { display: flex; height: 100vh; background: var(--paper); }

/* ── Sidebar ─────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--white);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  overflow-y: auto;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 4px 10px 18px; }
.brand-mark {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--ink); color: var(--white);
  border-radius: var(--r-sm);
  flex-shrink: 0;
}
.brand-text { font-family: var(--font-hand); font-size: 24px; font-weight: 600; line-height: 1; letter-spacing: 0.3px; }
.brand-text small { font-family: var(--font); font-size: 9px; color: var(--sub); display: block; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; margin-top: 1px; }

.compose-btn {
  width: 100%;
  border: 1px solid var(--ink);
  background: var(--coral);
  color: var(--white);
  padding: 9px 14px;
  border-radius: var(--r-sm);
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
  box-shadow: 0 1px 0 var(--ink);
  transition: transform 0.06s, box-shadow 0.06s;
  text-decoration: none;
}
.compose-btn:hover { background: var(--coral-deep); }
.compose-btn:active { transform: translateY(1px); box-shadow: none; }

.nav-section-label {
  font-size: 10px;
  color: var(--sub);
  text-transform: uppercase;
  letter-spacing: 1.4px;
  font-weight: 600;
  padding: 0 12px;
  margin: 14px 0 4px;
  display: flex; align-items: center; gap: 6px;
}
.nav-section-label.admin { color: var(--coral); }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  font-size: 13.5px;
  border-radius: var(--r-sm);
  cursor: pointer;
  margin-bottom: 1px;
  color: var(--ink-soft);
  border-left: 2.5px solid transparent;
  margin-left: -2.5px;
  padding-left: 11.5px;
  user-select: none;
  text-decoration: none;
}
.nav-item:hover { background: var(--paper); }
.nav-item.active {
  background: var(--coral-soft);
  color: var(--ink);
  font-weight: 600;
  border-left-color: var(--coral);
}
.nav-item-icon { width: 16px; height: 16px; color: var(--sub); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.nav-item.active .nav-item-icon { color: var(--coral); }
.nav-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-item-count { font-size: 11px; color: var(--sub); font-variant-numeric: tabular-nums; }
.nav-item.active .nav-item-count { color: var(--coral); font-weight: 600; }

.address-dot { width: 8px; height: 8px; border-radius: 4px; background: var(--coral); flex-shrink: 0; }
.address-dot.muted { background: var(--mid); }

.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 32px; height: 32px;
  border-radius: 16px;
  background: var(--coral-soft);
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--ink);
  flex-shrink: 0;
}
.avatar.lg { width: 38px; height: 38px; font-size: 12.5px; }
.user-info { flex: 1; min-width: 0; }
.user-name { font-size: 12.5px; font-weight: 600; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-email { font-size: 10.5px; color: var(--sub); font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.icon-btn {
  width: 28px; height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--r-sm);
  color: var(--sub);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
  padding: 0;
}
.icon-btn:hover { background: var(--paper-2); color: var(--ink); }

/* ── Main area ───────────────────────────── */
.main { flex: 1; display: flex; min-width: 0; background: var(--paper); }

/* ── Mail list pane ──────────────────────── */
.list-pane {
  width: 360px;
  flex-shrink: 0;
  background: var(--white);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
.list-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--line);
}
.list-title-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.list-title { font-family: var(--font-hand); font-size: 26px; font-weight: 600; line-height: 1; }
.list-count { font-size: 11.5px; color: var(--sub); font-variant-numeric: tabular-nums; }
.search-input {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--paper);
  border-radius: var(--r-sm);
  padding: 7px 12px 7px 32px;
  font-size: 13px;
  color: var(--ink);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238a8276' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/></svg>");
  background-repeat: no-repeat;
  background-position: 10px center;
  outline: none;
  transition: border-color 0.12s, background-color 0.12s;
}
.search-input:focus { border-color: var(--ink); background-color: var(--white); }
.search-input::placeholder { color: var(--mid); }

.list-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }
.mail-row {
  padding: 12px 18px;
  border-bottom: 1px solid var(--line-soft);
  cursor: pointer;
  display: flex; gap: 10px;
  border-left: 3px solid transparent;
  transition: background 0.08s;
}
.mail-row:hover { background: var(--paper); }
.mail-row.active { background: var(--coral-soft); border-left-color: var(--coral); }
.mail-row.unread .mail-from { font-weight: 700; }
.mail-row.unread .mail-subject { font-weight: 600; }

.mail-avatar {
  width: 32px; height: 32px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--paper);
  font-size: 11px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--ink);
}
.mail-row.active .mail-avatar { background: var(--white); border-color: var(--coral); }

.mail-content { flex: 1; min-width: 0; }
.mail-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 1px; }
.mail-from { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-time { font-size: 11px; color: var(--sub); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.mail-subject { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
.mail-preview { font-size: 11.5px; color: var(--sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-meta { display: flex; gap: 4px; align-items: center; margin-top: 6px; }
.mail-tag {
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--paper-2);
  color: var(--sub);
  font-family: var(--font-mono);
}
.unread-dot { width: 6px; height: 6px; border-radius: 3px; background: var(--coral); margin-top: 5px; flex-shrink: 0; }

/* ── Read pane ───────────────────────────── */
.read-pane { flex: 1; display: flex; flex-direction: column; background: var(--paper); min-width: 0; }
.read-toolbar {
  padding: 12px 24px;
  background: var(--white);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.tool-btn {
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: var(--white);
  border-radius: var(--r-sm);
  font-size: 12.5px;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.1s, border-color 0.1s;
  cursor: pointer;
}
.tool-btn:hover { background: var(--paper); border-color: var(--mid); }
.tool-btn.icon-only { padding: 6px 8px; }
.tool-btn.danger:hover { border-color: var(--red); color: var(--red); }

.read-body { padding: 24px 32px; overflow-y: auto; flex: 1; max-width: 820px; }
.read-subject { font-size: 22px; font-weight: 600; margin-bottom: 16px; line-height: 1.3; }
.read-header { display: flex; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.read-from { font-size: 13px; }
.read-from b { font-weight: 600; }
.read-from .addr { font-family: var(--font-mono); color: var(--sub); font-size: 12px; margin-left: 4px; }
.read-to { font-size: 11.5px; color: var(--sub); margin-top: 2px; display: flex; gap: 6px; align-items: center; }
.read-time { font-size: 11.5px; color: var(--sub); margin-left: auto; white-space: nowrap; }

.read-content { font-size: 14px; line-height: 1.75; color: var(--ink); }
.read-content p { margin: 0 0 12px; }
.read-quote {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 12px 16px;
  font-size: 13px;
  color: var(--ink-soft);
}
.attachment {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  font-size: 12px;
  margin-top: 8px;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.1s;
}
.attachment:hover { border-color: var(--mid); }
.attachment-icon { color: var(--coral); }
.attachment-size { color: var(--sub); font-size: 11px; }

/* ── Tags / badges ───────────────────────── */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 3px;
  background: var(--paper-2);
  color: var(--ink-soft);
  font-weight: 500;
}
.tag.coral { background: var(--coral); color: var(--white); }
.tag.coral-soft { background: var(--coral-soft); color: var(--coral-deep); }
.tag.outline { background: transparent; border: 1px solid var(--line); }
.tag.amber { background: var(--amber); color: var(--white); }

/* ── Compose drawer ──────────────────────── */
.compose-drawer {
  position: fixed;
  right: 24px;
  bottom: 0;
  width: 520px;
  max-width: calc(100vw - 48px);
  background: var(--white);
  border: 1px solid var(--ink);
  border-bottom: none;
  border-radius: var(--r-md) var(--r-md) 0 0;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  z-index: 50;
  animation: slideUp 0.25s cubic-bezier(0.2, 0.8, 0.3, 1);
  max-height: 80vh;
}
.compose-drawer.minimized { max-height: 44px; }
.compose-drawer.minimized .compose-body,
.compose-drawer.minimized .compose-toolbar { display: none; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.compose-header {
  padding: 11px 16px;
  background: var(--ink);
  color: var(--white);
  border-radius: var(--r-md) var(--r-md) 0 0;
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}
.compose-title { flex: 1; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.compose-header-actions { display: flex; gap: 4px; }
.compose-header-actions .icon-btn { color: rgba(255,255,255,0.7); width: 22px; height: 22px; }
.compose-header-actions .icon-btn:hover { background: rgba(255,255,255,0.15); color: var(--white); }

.compose-body { flex: 1; overflow-y: auto; padding: 4px 16px 12px; display: flex; flex-direction: column; gap: 0; }
.compose-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line-soft);
}
.compose-row label { font-size: 11px; color: var(--sub); width: 40px; flex-shrink: 0; font-weight: 500; }
.compose-row input, .compose-row textarea, .compose-row select {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13.5px;
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
  font-size: 13.5px;
  line-height: 1.7;
  resize: none;
  padding: 12px 0;
  min-height: 160px;
  background: transparent;
  width: 100%;
}

.compose-toolbar {
  padding: 10px 16px;
  border-top: 1px solid var(--line);
  background: var(--paper);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.btn-primary {
  padding: 7px 16px;
  border: 1px solid var(--ink);
  background: var(--coral);
  color: var(--white);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 1px 0 var(--ink);
  transition: transform 0.06s, background 0.12s;
  cursor: pointer;
}
.btn-primary:hover { background: var(--coral-deep); }
.btn-primary:active { transform: translateY(1px); box-shadow: none; }
.btn-primary:disabled { background: var(--mid); cursor: not-allowed; box-shadow: none; }

.compose-save { font-size: 11px; color: var(--sub); margin-left: auto; }

/* ── Toasts ──────────────────────────────── */
.toast-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  z-index: 100;
  pointer-events: none;
}
.toast {
  background: var(--white);
  border: 1px solid var(--ink);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-md);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  pointer-events: auto;
  animation: toastIn 0.3s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.toast.exit { animation: toastOut 0.2s forwards; }
@keyframes toastIn { from { transform: translateX(100%); opacity: 0; } }
@keyframes toastOut { to { transform: translateX(100%); opacity: 0; } }

.toast-icon {
  width: 30px; height: 30px;
  border-radius: 15px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--ink);
}
.toast.success .toast-icon { background: var(--coral); color: var(--white); }
.toast.info .toast-icon { background: var(--coral-soft); color: var(--coral-deep); }
.toast.error .toast-icon { background: var(--white); color: var(--red); border-color: var(--red); }
.toast.dark { background: var(--ink); color: var(--white); }
.toast.dark .toast-icon { background: var(--coral); color: var(--white); border-color: var(--coral); }

.toast-content { flex: 1; min-width: 0; }
.toast-title { font-size: 13px; font-weight: 600; line-height: 1.3; }
.toast-desc { font-size: 11.5px; opacity: 0.7; margin-top: 1px; }
.toast.dark .toast-desc { opacity: 0.75; }
.toast-close { font-size: 16px; color: inherit; opacity: 0.5; cursor: pointer; padding: 0 4px; background: transparent; border: none; }
.toast-close:hover { opacity: 1; }

/* ── Login screen ────────────────────────── */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  padding: 40px;
  position: relative;
}
.login-card {
  width: 360px;
  max-width: 100%;
}
.login-mark { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 32px; }
.login-mark .brand-mark { width: 36px; height: 36px; }
.login-mark .brand-text { font-size: 30px; }
.login-greeting { margin-bottom: 36px; }
.login-greeting h1 { font-family: var(--font-hand); font-size: 42px; font-weight: 700; margin: 0; line-height: 1; }
.login-greeting p { font-size: 13px; color: var(--sub); margin: 6px 0 0; }
.login-field { margin-bottom: 22px; }
.login-field label {
  display: block;
  font-size: 10.5px;
  color: var(--sub);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  font-weight: 600;
  margin-bottom: 6px;
}
.login-field .underline-input {
  width: 100%;
  border: none;
  border-bottom: 1.5px solid var(--ink);
  padding: 6px 0;
  font-size: 15px;
  background: transparent;
  outline: none;
  color: var(--ink);
  transition: border-color 0.15s;
}
.login-field .underline-input:focus { border-color: var(--coral); }
.login-field .underline-input::placeholder { color: var(--mid); }

.login-cta {
  background: transparent;
  border: none;
  padding: 0;
  margin-top: 14px;
  font-family: var(--font-hand);
  font-size: 28px;
  font-weight: 700;
  color: var(--coral);
  cursor: pointer;
  text-align: left;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.18s, color 0.18s;
}
.login-cta:hover { gap: 12px; color: var(--coral-deep); }
.login-cta:disabled { color: var(--mid); cursor: not-allowed; }

.login-footer {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--sub);
  font-family: var(--font-mono);
  white-space: nowrap;
}
.login-error {
  background: var(--white);
  border: 1px solid var(--ink);
  border-left: 4px solid var(--coral);
  padding: 10px 14px;
  border-radius: var(--r-sm);
  margin-bottom: 18px;
  display: flex; gap: 10px; align-items: flex-start;
  animation: shake 0.3s;
}
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.login-error-icon { color: var(--coral); flex-shrink: 0; font-weight: 700; font-size: 14px; margin-top: 1px; }
.login-error-body { font-size: 12px; }
.login-error-body b { font-weight: 600; }
.login-error-body div { color: var(--sub); font-size: 11px; margin-top: 1px; }

/* ── Page header (admin screens) ─────────── */
.page { flex: 1; overflow-y: auto; padding: 0; }
.page-inner { padding: 28px 36px; max-width: 1200px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-family: var(--font-hand); font-size: 38px; font-weight: 600; line-height: 1; margin: 0 0 4px; }
.page-subtitle { font-size: 13px; color: var(--sub); }
.page-actions { display: flex; gap: 8px; align-items: center; }

.btn-ghost {
  padding: 7px 14px;
  border: 1px solid var(--line);
  background: var(--white);
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--ink-soft);
  display: inline-flex; align-items: center; gap: 6px;
  transition: border-color 0.1s, background 0.1s;
  cursor: pointer;
}
.btn-ghost:hover { border-color: var(--mid); background: var(--paper); }
.btn-secondary {
  padding: 7px 14px;
  border: 1px solid var(--ink);
  background: var(--white);
  color: var(--ink);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
  cursor: pointer;
}
.btn-secondary:hover { background: var(--paper); }

/* ── Filter pills ────────────────────────── */
.filter-row { display: flex; gap: 10px; margin-bottom: 18px; align-items: center; flex-wrap: wrap; }
.filter-search { flex: 1; max-width: 340px; }
.pill {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--white);
  font-size: 12px;
  color: var(--ink-soft);
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}
.pill:hover { border-color: var(--mid); }
.pill.active { background: var(--ink); color: var(--white); border-color: var(--ink); }

/* ── Table ───────────────────────────────── */
.table-wrap { background: var(--white); border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
table.dt { width: 100%; border-collapse: collapse; }
.dt thead th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  font-weight: 600;
  color: var(--sub);
  padding: 12px 16px;
  background: var(--paper);
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
.dt tbody tr:hover { background: var(--paper); }
.dt .col-actions { width: 80px; text-align: right; }
.link { color: var(--coral); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font-weight: 500; }

/* ── Address cards ───────────────────────── */
.address-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.address-card:hover { border-color: var(--mid); box-shadow: var(--shadow-sm); }
.address-card.expanded { border: 1px solid var(--ink); box-shadow: var(--shadow-md); display: block; padding: 0; cursor: default; }

.address-icon {
  width: 40px; height: 40px;
  border-radius: var(--r-sm);
  background: var(--paper-2);
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--ink);
}
.address-card.expanded .address-icon-row .address-icon { background: var(--coral); color: var(--white); border-color: var(--ink); }
.address-info { flex: 1; min-width: 0; }
.address-addr { font-family: var(--font-mono); font-size: 14px; font-weight: 600; }
.address-addr .domain { font-weight: 400; color: var(--sub); }
.address-desc { font-size: 11.5px; color: var(--sub); margin-top: 2px; }
.address-state { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-soft); }

.address-icon-row { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid var(--line); }
.address-detail { padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.detail-label {
  font-size: 10.5px;
  color: var(--sub);
  text-transform: uppercase;
  letter-spacing: 1.1px;
  font-weight: 600;
  margin-bottom: 8px;
}

/* ── Confirm dialog ──────────────────────── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(31,26,22,0.35);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.18s;
}
@keyframes fadeIn { from { opacity: 0; } }
.dialog {
  background: var(--white);
  border: 1px solid var(--ink);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
  width: 400px;
  max-width: calc(100vw - 48px);
  padding: 22px 24px;
}
.dialog h3 { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
.dialog p { font-size: 13px; color: var(--sub); margin: 0 0 20px; line-height: 1.5; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-danger {
  padding: 7px 16px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--white);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover { background: var(--ink-soft); }

/* ── Empty / placeholder ─────────────────── */
.empty-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--sub);
  font-size: 13px;
  gap: 8px;
  padding: 40px;
  text-align: center;
}
.empty-pane .big { font-family: var(--font-hand); font-size: 28px; color: var(--mid); font-weight: 600; }

/* ── Dashboard KPI ───────────────────────── */
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px; }
@media (min-width: 1100px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
.kpi-tile {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 16px;
  position: relative;
  overflow: hidden;
}
.kpi-label { font-size: 11.5px; color: var(--sub); font-weight: 600; text-transform: uppercase; letter-spacing: 1.1px; margin-bottom: 6px; }
.kpi-value { font-family: var(--font-hand); font-size: 40px; font-weight: 700; line-height: 1; color: var(--coral); }
.kpi-sub { font-size: 10.5px; color: var(--sub); margin-top: 2px; }
.kpi-delta { font-size: 11px; font-weight: 600; }
.kpi-delta.up { color: var(--coral); }
.kpi-delta.down { color: var(--sub); }

.section-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  overflow: hidden;
  margin-bottom: 14px;
}
.section-card-header {
  padding: 12px 18px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-card-title { font-size: 14px; font-weight: 600; }
.section-card-sub { font-size: 11.5px; color: var(--sub); }

.addr-bar-row { display: flex; align-items: center; gap: 12px; padding: 8px 18px; }
.addr-bar-label { width: 100px; font-family: var(--font-mono); font-size: 13px; font-weight: 500; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addr-bar-track { flex: 1; height: 8px; background: var(--paper-2); border-radius: 4px; position: relative; overflow: hidden; }
.addr-bar-fill { height: 100%; background: var(--coral); border-radius: 4px; }
.addr-bar-count { width: 60px; text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 600; flex-shrink: 0; }

/* ── Misc ───────────────────────────────── */
.divider { height: 1px; background: var(--line); margin: 12px 0; }
.fade { animation: fade 0.2s; }
@keyframes fade { from { opacity: 0; } }

/* Scrollbars */
.list-scroll::-webkit-scrollbar { width: 6px; }
.list-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
.page::-webkit-scrollbar { width: 8px; }
.page::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.read-body::-webkit-scrollbar { width: 8px; }
.read-body::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--line); border-radius: 2px; }

/* ── Form fields ─────────────────────────── */
.form-field { margin-bottom: 14px; }
.form-label { display: block; font-size: 10.5px; color: var(--sub); text-transform: uppercase; letter-spacing: 1.1px; font-weight: 600; margin-bottom: 6px; }
.form-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 8px 12px;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--white);
  outline: none;
  transition: border-color 0.12s;
}
.form-input:focus { border-color: var(--ink); }
.form-input::placeholder { color: var(--mid); }
.form-select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%238a8276' d='M0 0h12L6 8z'/></svg>"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
`
