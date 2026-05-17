import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { SessionUser } from '../types'

export const SettingsPage: FC<{ currentUser: SessionUser }> = ({ currentUser }) => (
  <Layout title="設定" user={currentUser} active="settings">
    <h1 class="text-2xl font-bold mb-4">設定</h1>
    <section class="bg-white border rounded p-4 max-w-sm">
      <h2 class="font-semibold mb-3">パスワード変更</h2>
      <form
        hx-post="/settings/password"
        hx-target="#pw-result"
        hx-swap="innerHTML"
        hx-on::after-request="if(event.detail.successful) this.reset()"
        class="space-y-3"
      >
        <input name="current_password" type="password" required placeholder="現在のパスワード" class="w-full border rounded px-3 py-2" />
        <input name="new_password" type="password" required minlength={8} placeholder="新しいパスワード (8文字以上)" class="w-full border rounded px-3 py-2" />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">変更する</button>
      </form>
      <div id="pw-result" class="mt-2"></div>
    </section>
  </Layout>
)
