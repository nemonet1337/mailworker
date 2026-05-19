import { FC } from 'hono/jsx'
import { Layout } from '../layout'
import { SessionUser } from '../../types'

type UserRow = SessionUser & { created_at: string }

export const UsersPage: FC<{ currentUser: SessionUser; users: UserRow[] }> = ({ currentUser, users }) => (
  <Layout title="ユーザー管理" user={currentUser} active="users">
    <h1 class="text-2xl font-bold mb-4">ユーザー管理</h1>

    <section class="bg-white border rounded p-4 mb-6">
      <form
        hx-post="/admin/users"
        hx-target="#user-form-result"
        hx-swap="innerHTML"
        {...({'hx-on::after-request': "if(event.detail.successful) this.reset()"} as object)}
        class="grid md:grid-cols-4 gap-3"
      >
        <input name="display_name" type="text" required placeholder="表示名" class="border rounded px-3 py-2" />
        <input name="email" type="email" required placeholder="メールアドレス" class="border rounded px-3 py-2" />
        <input name="password" type="password" required minlength={8} placeholder="初期パスワード" class="border rounded px-3 py-2" />
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_admin" />管理者権限</label>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-fit">追加</button>
      </form>
      <div id="user-form-result" class="mt-2"></div>
    </section>

    <table class="w-full bg-white border rounded overflow-hidden text-sm">
      <thead class="bg-gray-50"><tr><th>表示名</th><th>ログイン用メアド</th><th>管理者</th><th>作成日</th><th>操作</th></tr></thead>
      <tbody>
        {users.map((u) => (
          <tr class="border-t" key={u.id}>
            <td class="p-2">{u.display_name}</td><td class="p-2">{u.email}</td><td class="p-2">{u.is_admin === 1 ? '✓' : ''}</td><td class="p-2">{u.created_at.slice(0, 10).replace(/-/g, '/')}</td>
            <td class="p-2">
              <button hx-post={`/admin/users/${u.id}/delete`} hx-target="closest tr" hx-swap="outerHTML swap:0.3s" hx-confirm="このユーザーを削除しますか？" class="text-red-600">削除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Layout>
)
