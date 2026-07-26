import { FC } from 'hono/jsx'
import { LoginLayout } from './layout'
import { LogoMark } from './icons'

export const LoginPage: FC = () => (
  <LoginLayout title="ログイン">
    <div class="login-screen">
      <form
        class="login-card"
        hx-post="/login"
        hx-target="#login-error"
        hx-swap="innerHTML"
      >
        <div class="login-mark">
          <LogoMark size={40} />
          <div class="brand-text">
            WorkerMail
            <small>self-hosted on cloudflare</small>
          </div>
        </div>

        <div class="login-greeting">
          <h1>WorkerMail へようこそ</h1>
          <p>アカウントにサインインしてください</p>
        </div>

        <div id="login-error" />

        <div class="login-field">
          <label>メールアドレス</label>
          <input
            class="input w-full"
            name="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            autofocus
          />
        </div>

        <div class="login-field">
          <label>パスワード</label>
          <input
            class="input w-full"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <button class="btn btn-primary w-full mt-2" type="submit">
          サインイン
        </button>
      </form>

      <div class="login-footer">WorkerMail · nemonet.work</div>
    </div>
  </LoginLayout>
)

export const LoginError: FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div class="alert alert-error mb-4" role="alert">
    <span class="font-bold">!</span>
    <div>
      <div class="font-semibold">{title}</div>
      {desc && <div class="text-xs opacity-80">{desc}</div>}
    </div>
  </div>
)
