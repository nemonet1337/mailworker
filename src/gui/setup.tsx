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
            class="underline-input"
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
            class="underline-input"
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
            class="underline-input"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            placeholder="••••••••"
          />
        </div>

        <button class="login-cta" type="submit">
          Create account →
        </button>
      </form>

      <div class="login-footer">workermail.nemonet.work · v0.1</div>
    </div>
  </LoginLayout>
)

export const SetupError: FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div class="login-error">
    <span class="login-error-icon">!</span>
    <div class="login-error-body">
      <b>{title}</b>
      {desc && <div>{desc}</div>}
    </div>
  </div>
)
