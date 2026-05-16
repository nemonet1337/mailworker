import { FC } from 'hono/jsx'
import { Layout } from './layout'

export const LoginPage: FC = () => (
  <Layout title="Login">
    <div class="min-h-[80vh] flex items-center justify-center">
      <div class="bg-white shadow border rounded-lg p-6 w-full max-w-sm">
        <h1 class="text-2xl font-bold mb-5">Mail</h1>
        <form hx-post="/login" hx-target="#login-error" hx-swap="innerHTML" class="space-y-3">
          <input name="email" type="email" autocomplete="email" required class="w-full border rounded px-3 py-2" placeholder="email@example.com" />
          <input name="password" type="password" autocomplete="current-password" required class="w-full border rounded px-3 py-2" placeholder="Password" />
          <button type="submit" class="w-full bg-blue-600 text-white rounded py-2">ログイン</button>
        </form>
        <div id="login-error" class="mt-2"></div>
      </div>
    </div>
  </Layout>
)
