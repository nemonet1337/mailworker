import { FC } from 'hono/jsx'
import { LoginLayout } from './layout'
import { LogoMark } from './icons'

export const SetupPage: FC = () => (
  <LoginLayout title="初回セットアップ">
    <div class="login-screen">
      <form
        class="login-card"
        hx-post="/setup"
        hx-target="#setup-error"
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
          <h1>Setup.</h1>
          <p>管理者アカウントを作成してください · Create admin account</p>
        </div>

        <div id="setup-error" />

        <div class="login-field">
          <label>表示名 / Display name</label>
          <input
            class="input w-full"
            name="display_name"
            type="text"
            autocomplete="name"
            required
            placeholder="Administrator"
            autofocus
          />
        </div>

        <div class="login-field">
          <label>メール / Email</label>
          <input
            class="input w-full"
            name="email"
            type="email"
            autocomplete="email"
            required
            placeholder="admin@example.com"
          />
        </div>

        <div class="login-field">
          <label>パスワード / Password</label>
          <input
            class="input w-full"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            placeholder="••••••••"
          />
        </div>

        <button class="btn btn-primary w-full mt-2" type="submit">
          Create account →
        </button>
      </form>

      <div class="login-footer">workermail.nemonet.work · v0.1</div>
    </div>
  </LoginLayout>
)

export const SetupError: FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div class="alert alert-error mb-4" role="alert">
    <span class="font-bold">!</span>
    <div>
      <div class="font-semibold">{title}</div>
      {desc && <div class="text-xs opacity-80">{desc}</div>}
    </div>
  </div>
)
