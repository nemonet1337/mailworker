import { FC } from 'hono/jsx'
import { Layout } from '../layout'
import { SessionUser } from '../../types'

type Addr = { id: string; address: string; display_name: string; created_at: string }

export const AddressesPage: FC<{ currentUser: SessionUser; users: SessionUser[]; addresses: Addr[]; domain: string }> = ({ currentUser, users, addresses, domain }) => (
  <Layout title="メールアドレス管理" user={currentUser} active="addresses">
    <h1 class="text-2xl font-bold mb-4">メールアドレス管理</h1>
    <section class="bg-white border rounded p-4 mb-6">
      <form hx-post="/admin/addresses" hx-target="#addr-form-result" hx-swap="innerHTML" {...({'hx-on::after-request': "if(event.detail.successful) this.reset()"} as object)} class="grid md:grid-cols-3 gap-3">
        <div class="flex items-center gap-1">
          <input type="text" name="local" placeholder="username" required class="border rounded px-3 py-2" />
          <span class="text-gray-500">@{domain}</span>
        </div>
        <select name="user_id" required class="border rounded px-3 py-2">
          {users.map((u) => <option value={u.id}>{u.display_name}</option>)}
        </select>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-fit">追加</button>
      </form>
      <div id="addr-form-result" class="mt-2"></div>
    </section>

    <table class="w-full bg-white border rounded overflow-hidden text-sm">
      <thead class="bg-gray-50"><tr><th>メールアドレス</th><th>割り当てユーザー</th><th>作成日</th><th>操作</th></tr></thead>
      <tbody>
        {addresses.map((a) => (
          <tr class="border-t" key={a.id}>
            <td class="p-2">{a.address}</td><td class="p-2">{a.display_name}</td><td class="p-2">{a.created_at}</td>
            <td class="p-2"><button hx-post={`/admin/addresses/${a.id}/delete`} hx-target="closest tr" hx-swap="outerHTML swap:0.3s" hx-confirm="このアドレスを削除しますか？" class="text-red-600">削除</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </Layout>
)
