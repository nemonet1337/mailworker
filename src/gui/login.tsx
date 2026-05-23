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
          <h1>Mail.</h1>
          <p>ログインしてください · Sign in</p>
        </div>

        <div id="login-error" />

        <div class="login-field">
          <label>メール / Email</label>
          <input
            class="underline-input"
            name="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            autofocus
          />
        </div>

        <div class="login-field">
          <label>パスワード / Password</label>
          <input
            class="underline-input"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <button class="login-cta" type="submit">
          Sign in →
        </button>
      </form>

      <div class="login-footer">workermail.nemonet.work · v0.1</div>
    </div>
  </LoginLayout>
)

export const LoginError: FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div class="login-error">
    <span class="login-error-icon">!</span>
    <div class="login-error-body">
      <b>{title}</b>
      {desc && <div>{desc}</div>}
    </div>
  </div>
)
