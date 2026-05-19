import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { SessionUser } from '../types'

export const ComposePage: FC<{ currentUser: SessionUser; from_addresses: string[] }> = ({
  currentUser,
  from_addresses,
}) => (
  <Layout title="メール作成" user={currentUser} active="compose">
    <h1 class="text-2xl font-bold mb-4">新規メール作成</h1>
    <section class="bg-white border rounded p-4 max-w-2xl">
      <form
        hx-post="/compose"
        hx-target="#compose-result"
        hx-swap="innerHTML"
        {...({'hx-on::after-request': "if(event.detail.successful) this.reset()"} as object)}
        class="space-y-3"
      >
        <div>
          <label class="block text-sm font-medium mb-1">From</label>
          <select name="from_" required class="w-full border rounded px-3 py-2 text-sm">
            {from_addresses.map((addr) => (
              <option value={addr} key={addr}>{addr}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">To</label>
          <input name="to" type="email" required placeholder="to@example.com"
            class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">件名</label>
          <input name="subject" type="text" required placeholder="件名"
            class="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">本文</label>
          <textarea name="body" required rows={10}
            class="w-full border rounded px-3 py-2 text-sm font-mono resize-y" />
        </div>
        <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded">送信</button>
      </form>
      <div id="compose-result" class="mt-2"></div>
    </section>
  </Layout>
)
