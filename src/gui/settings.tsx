import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { Icon } from './icons'
import { SessionUser } from '../types'

export const SettingsPage: FC<{ currentUser: SessionUser }> = ({ currentUser }) => (
  <Layout title="設定" user={currentUser} active="settings">
    <div class="page">
      <div class="page-inner">
        <div class="page-header">
          <div>
            <h1 class="page-title">設定</h1>
          </div>
        </div>

        {currentUser.is_admin === 1 && (
          <div class="section-card" style="max-width:480px;margin-bottom:24px">
            <div class="section-card-header">
              <span class="section-card-title">管理者メニュー</span>
            </div>
            <div class="p-2">
              <a href="/admin/dashboard" class="nav-item">
                <span class="nav-item-icon"><Icon name="shield" size={16} /></span>
                <span class="nav-item-label">ダッシュボード</span>
                <Icon name="chevronRight" size={14} stroke="currentColor" />
              </a>
              <a href="/admin/users" class="nav-item">
                <span class="nav-item-icon"><Icon name="users" size={16} /></span>
                <span class="nav-item-label">ユーザー管理</span>
                <Icon name="chevronRight" size={14} stroke="currentColor" />
              </a>
              <a href="/admin/addresses" class="nav-item">
                <span class="nav-item-icon"><Icon name="at" size={16} /></span>
                <span class="nav-item-label">アドレス管理</span>
                <Icon name="chevronRight" size={14} stroke="currentColor" />
              </a>
            </div>
          </div>
        )}

        <div class="section-card" style="max-width:480px;margin-bottom:24px">
          <div class="section-card-header">
            <span class="section-card-title">表示モード</span>
          </div>
          <div class="p-5">
            <div class="flex gap-2">
              <button class="theme-mode-btn" data-mode="light" onclick="setThemeMode('light')">ライト</button>
              <button class="theme-mode-btn" data-mode="system" onclick="setThemeMode('system')">システム</button>
              <button class="theme-mode-btn" data-mode="dark" onclick="setThemeMode('dark')">ダーク</button>
            </div>
          </div>
        </div>

        <div class="section-card" style="max-width:480px;margin-bottom:24px">
          <div class="section-card-header">
            <span class="section-card-title">アクセントカラー</span>
          </div>
          <div class="p-5">
            <div class="flex gap-3.5 items-center">
              <button class="accent-swatch" data-accent="blue" onclick="setAccent('blue')" style="background:#1a73e8" title="ブルー" />
              <button class="accent-swatch" data-accent="green" onclick="setAccent('green')" style="background:#0f9d58" title="グリーン" />
              <button class="accent-swatch" data-accent="purple" onclick="setAccent('purple')" style="background:#7c3aed" title="パープル" />
              <button class="accent-swatch" data-accent="red" onclick="setAccent('red')" style="background:#d93025" title="レッド" />
              <button class="accent-swatch" data-accent="orange" onclick="setAccent('orange')" style="background:#e37400" title="オレンジ" />
            </div>
          </div>
        </div>

        <div class="section-card" style="max-width:480px">
          <div class="section-card-header">
            <span class="section-card-title">パスワード変更</span>
          </div>
          <div class="p-5">
            <form
              hx-post="/settings/password"
              hx-target="#pw-result"
              hx-swap="innerHTML"
              {...({'hx-on::after-request': "if(event.detail.successful) this.reset()"} as object)}
            >
              <div class="form-field">
                <label class="form-label">現在のパスワード</label>
                <input name="current_password" type="password" required placeholder="現在のパスワード" class="form-input" />
              </div>
              <div class="form-field">
                <label class="form-label">新しいパスワード</label>
                <input name="new_password" type="password" required minlength={8} placeholder="8文字以上" class="form-input" />
              </div>
              <button type="submit" class="btn btn-primary btn-sm">変更する</button>
            </form>
            <div id="pw-result" class="mt-3"></div>
          </div>
        </div>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: `
      function setThemeMode(m) {
        localStorage.setItem('wm-theme', m);
        var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement[dark ? 'setAttribute' : 'removeAttribute']('data-theme', 'dark');
        document.querySelectorAll('.theme-mode-btn').forEach(function(b) {
          if (b.dataset.mode === m) b.classList.add('active');
          else b.classList.remove('active');
        });
      }
      function setAccent(a) {
        localStorage.setItem('wm-accent', a);
        if (a === 'blue') document.documentElement.removeAttribute('data-accent');
        else document.documentElement.setAttribute('data-accent', a);
        document.querySelectorAll('.accent-swatch').forEach(function(b) {
          if (b.dataset.accent === a) b.classList.add('active');
          else b.classList.remove('active');
        });
      }
      (function() {
        var t = localStorage.getItem('wm-theme') || 'system';
        var a = localStorage.getItem('wm-accent') || 'blue';
        document.querySelectorAll('.theme-mode-btn').forEach(function(b) {
          if (b.dataset.mode === t) b.classList.add('active');
          else b.classList.remove('active');
        });
        document.querySelectorAll('.accent-swatch').forEach(function(b) {
          if (b.dataset.accent === a) b.classList.add('active');
          else b.classList.remove('active');
        });
      })();
    `}} />
  </Layout>
)
