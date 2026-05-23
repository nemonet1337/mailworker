import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { Icon } from './icons'
import { SessionUser } from '../types'

export const ComposePage: FC<{ currentUser: SessionUser; from_addresses: string[] }> = ({
  currentUser,
  from_addresses,
}) => (
  <Layout title="メール作成" user={currentUser}>
    <div class="page">
      <div class="page-inner" style="max-width:680px">
        <div class="page-header">
          <div>
            <h1 class="page-title">新規メール</h1>
          </div>
        </div>

        <div class="section-card">
          <form
            hx-post="/compose"
            hx-target="#compose-result"
            hx-swap="innerHTML"
            {...({ 'hx-on::after-request': "if(event.detail.successful){this.reset();window.__showToast&&window.__showToast('送信しました','success')}" } as object)}
          >
            <div class="compose-row" style="padding:12px 20px">
              <label style="width:60px">From</label>
              <select name="from_" required style="flex:1;border:none;outline:none;font-size:13.5px;background:transparent">
                {from_addresses.map((addr) => (
                  <option value={addr} key={addr}>{addr}</option>
                ))}
              </select>
            </div>
            <div class="compose-row" style="padding:12px 20px">
              <label style="width:60px">To</label>
              <input name="to" type="email" required placeholder="to@example.com"
                style="flex:1;border:none;outline:none;font-size:13.5px;background:transparent" />
            </div>
            <div class="compose-row" style="padding:12px 20px">
              <label style="width:60px">件名</label>
              <input name="subject" type="text" placeholder="件名"
                style="flex:1;border:none;outline:none;font-size:13.5px;background:transparent" />
            </div>
            <div style="padding:12px 20px">
              <textarea name="body" required rows={14} placeholder="本文を入力..."
                class="compose-textarea" style="min-height:280px" />
            </div>
            <div class="compose-toolbar">
              <button type="submit" class="btn-primary">
                <Icon name="send" size={14} />
                送信
              </button>
              <div id="compose-result" style="flex:1;font-size:12px;color:var(--sub)" />
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
)

export const ComposeDrawerPartial: FC<{
  from_addresses: string[]
  replyTo?: { subject: string; from_: string }
}> = ({ from_addresses, replyTo }) => (
  <div class="compose-drawer" id="compose-drawer">
    <div
      class="compose-header"
      onclick="this.closest('.compose-drawer').classList.toggle('minimized')"
    >
      <span class="compose-title">
        {replyTo ? `Re: ${replyTo.subject}` : '新規メール'}
      </span>
      <div class="compose-header-actions">
        <button
          class="icon-btn"
          title="最小化"
          onclick="event.stopPropagation();this.closest('.compose-drawer').classList.toggle('minimized')"
        >
          <Icon name="minus" size={14} />
        </button>
        <button
          class="icon-btn"
          title="閉じる"
          onclick="event.stopPropagation();document.getElementById('compose-slot').innerHTML=''"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>

    <div class="compose-body">
      <form
        id="compose-drawer-form"
        hx-post="/compose"
        hx-target="#compose-drawer-result"
        hx-swap="innerHTML"
        {...({
          'hx-on::after-request': "if(event.detail.successful){document.getElementById('compose-slot').innerHTML='';window.__showToast&&window.__showToast('送信しました','success')}",
        } as object)}
      >
        <div class="compose-row">
          <label>From</label>
          <select name="from_" required>
            {from_addresses.map((addr) => (
              <option value={addr} key={addr}>{addr}</option>
            ))}
          </select>
        </div>
        <div class="compose-row">
          <label>To</label>
          <input
            name="to"
            type="email"
            required
            placeholder="to@example.com"
            value={replyTo ? replyTo.from_ : ''}
          />
        </div>
        <div class="compose-row">
          <label>件名</label>
          <input
            name="subject"
            type="text"
            placeholder="件名"
            value={replyTo ? `Re: ${replyTo.subject}` : ''}
          />
        </div>
        <textarea
          name="body"
          class="compose-textarea"
          placeholder="本文を入力..."
        />
      </form>
    </div>

    <div class="compose-toolbar">
      <button type="submit" class="btn-primary" form="compose-drawer-form">
        <Icon name="send" size={14} />
        送信
      </button>
      <div id="compose-drawer-result" class="compose-save" />
    </div>
  </div>
)
