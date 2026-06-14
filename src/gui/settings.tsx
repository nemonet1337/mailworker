import { FC } from 'hono/jsx'
import { Layout } from './layout'
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

        <div class="section-card" style="max-width:480px">
          <div class="section-card-header">
            <span class="section-card-title">パスワード変更</span>
          </div>
          <div style="padding:20px">
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
              <button type="submit" class="btn-primary">変更する</button>
            </form>
            <div id="pw-result" style="margin-top:12px"></div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
)
