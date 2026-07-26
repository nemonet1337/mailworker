import { FC } from 'hono/jsx'
import { Icon } from './icons'

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

    <form
      id="compose-drawer-form"
      hx-post="/compose"
      hx-target="#compose-drawer-result"
      hx-swap="innerHTML"
      hx-disabled-elt="find button[type=submit]"
      {...({
        'hx-on::after-request': "if(event.detail.successful){document.getElementById('compose-slot').innerHTML='';window.__showToast&&window.__showToast('送信しました','success')}",
      } as object)}
    >
      <div class="compose-body">
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
          required
        />
      </div>

      <div class="compose-toolbar">
        <button type="submit" class="btn-primary">
          <Icon name="send" size={14} />
          送信
        </button>
        <label class="compose-schedule" title="予約送信（空なら即時）">
          <span>予約</span>
          <input type="datetime-local" name="scheduled_at" />
        </label>
        <div id="compose-drawer-result" class="compose-save" />
      </div>
    </form>
  </div>
)
