import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { Icon } from './icons'
import { SessionUser, EmailRow } from '../types'

type AttachmentItem = {
  id: string
  filename: string
  content_type: string
  size: number
}

function senderInitials(addr: string): string {
  const name = addr.replace(/[<>]/g, '').trim() || addr
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

function senderName(addr: string): string {
  const m = addr.match(/^(.+?)\s*</)
  if (m) return m[1].trim()
  return addr
}

function formatTime(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString('ja-JP', { weekday: 'short' })
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export const MailRows: FC<{ emails: EmailRow[]; showTo?: boolean }> = ({ emails, showTo }) => (
  <>
    {emails.length === 0 ? (
      <div class="empty-pane" style="padding-top:60px">
        <Icon name="inbox" size={36} stroke="var(--mid)" />
        <div class="big" style="margin-top:12px">メールなし</div>
        <div>受信メールがここに表示されます</div>
      </div>
    ) : (
      emails.map((m) => (
        <div
          key={m.id}
          id={`mail-row-${m.id}`}
          class={`mail-row${m.is_read === 0 ? ' unread' : ''}`}
          hx-get={`/mail/${m.id}`}
          hx-target="#read-pane"
          hx-swap="innerHTML"
          {...({
            'hx-on::after-request': `htmx.ajax('POST','/mail/${m.id}/read',{swap:'none'});document.querySelectorAll('.mail-row').forEach(function(r){r.classList.remove('active')});this.classList.add('active');this.classList.remove('unread');var ma=document.getElementById('main-area');if(ma)ma.classList.add('show-detail')`,
          } as object)}
        >
          <div class="mail-avatar">{senderInitials(showTo ? (m.to_address ?? m.from_) : m.from_)}</div>
          <div class="mail-content">
            <div class="mail-row-top">
              <span class="mail-from">{senderName(showTo ? (m.to_address ?? m.from_) : m.from_)}</span>
              <span class="mail-time">{formatTime(m.received_at)}</span>
            </div>
            <div class="mail-subject">{m.subject || '(件名なし)'}</div>
          </div>
          {m.is_starred === 1 && (
            <span style="color:#f59e0b;font-size:13px;margin-right:4px">★</span>
          )}
          {m.is_read === 0 && <div class="unread-dot" />}
        </div>
      ))
    )}
  </>
)

export const InboxRows = MailRows

function FolderPage({
  currentUser,
  emails,
  title,
  active,
  showTo,
  page,
  hasNext,
  basePath,
  emptyIcon,
  emptyText,
}: {
  currentUser: SessionUser
  emails: EmailRow[]
  title: string
  active: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'starred'
  showTo?: boolean
  page: number
  hasNext: boolean
  basePath: string
  emptyIcon?: string
  emptyText?: string
}) {
  const qs = (p: number) => `${basePath}?page=${p}`

  return (
    <Layout title={title} user={currentUser} active={active}>
      <div class="list-pane">
        <div class="list-header">
          <div class="list-title-row">
            <div class="list-title">{title}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <input
              class="search-input"
              type="search"
              placeholder="検索..."
              oninput="(function(q){document.querySelectorAll('.mail-row').forEach(function(r){r.style.display=!q||r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none'})})(this.value)"
              style="flex:1"
            />
            <button
              class="icon-btn"
              title="更新"
              onclick={`location.href='${basePath}'`}
            >
              <Icon name="refresh" size={15} />
            </button>
          </div>
        </div>

        <div class="list-scroll" id="mail-list">
          {emails.length === 0 ? (
            <div class="empty-pane" style="padding-top:60px">
              <Icon name={emptyIcon as any ?? 'inbox'} size={36} stroke="var(--mid)" />
              <div class="big" style="margin-top:12px">{emptyText ?? 'メールなし'}</div>
            </div>
          ) : (
            <MailRows emails={emails} showTo={showTo} />
          )}
        </div>

        {(page > 1 || hasNext) && (
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 18px;border-top:1px solid var(--line);font-size:12px;flex-shrink:0">
            {page > 1 ? (
              <a href={qs(page - 1)} style="color:var(--coral);text-decoration:none;font-weight:500">← 前</a>
            ) : (
              <span style="color:var(--mid)">← 前</span>
            )}
            <span style="color:var(--sub)">{page}ページ</span>
            {hasNext ? (
              <a href={qs(page + 1)} style="color:var(--coral);text-decoration:none;font-weight:500">次 →</a>
            ) : (
              <span style="color:var(--mid)">次 →</span>
            )}
          </div>
        )}
      </div>

      <div class="read-pane" id="read-pane">
        <div class="empty-pane">
          <Icon name="mail" size={40} stroke="var(--mid)" />
          <div class="big" style="margin-top:12px">メールを選択</div>
          <div>リストからメールをクリックして表示</div>
        </div>
      </div>
    </Layout>
  )
}

export const InboxPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  addresses: string[]
  selectedAddr: string
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, selectedAddr, page, hasNext }) => {
  const qs = (p: number) => {
    const params = new URLSearchParams()
    if (selectedAddr) params.set('addr', selectedAddr)
    params.set('page', String(p))
    return `/?${params.toString()}`
  }

  const title = selectedAddr ? selectedAddr.split('@')[0] : '受信箱'
  const unreadCount = emails.filter((m) => m.is_read === 0).length

  return (
    <Layout title="受信箱" user={currentUser} active="inbox">
      <div class="list-pane">
        <div class="list-header">
          <div class="list-title-row">
            <div class="list-title">{title}</div>
            {unreadCount > 0 && (
              <span class="list-count">{unreadCount}未読</span>
            )}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <input
              class="search-input"
              type="search"
              placeholder="検索..."
              oninput="(function(q){document.querySelectorAll('.mail-row').forEach(function(r){r.style.display=!q||r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none'})})(this.value)"
              style="flex:1"
            />
            <button
              class="icon-btn"
              title="更新"
              onclick={`location.href='${selectedAddr ? `/?addr=${encodeURIComponent(selectedAddr)}` : '/'}'`}
            >
              <Icon name="refresh" size={15} />
            </button>
          </div>
        </div>

        <div class="list-scroll" id="mail-list">
          <MailRows emails={emails} />
        </div>

        {(page > 1 || hasNext) && (
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 18px;border-top:1px solid var(--line);font-size:12px;flex-shrink:0">
            {page > 1 ? (
              <a href={qs(page - 1)} style="color:var(--coral);text-decoration:none;font-weight:500">← 前</a>
            ) : (
              <span style="color:var(--mid)">← 前</span>
            )}
            <span style="color:var(--sub)">{page}ページ</span>
            {hasNext ? (
              <a href={qs(page + 1)} style="color:var(--coral);text-decoration:none;font-weight:500">次 →</a>
            ) : (
              <span style="color:var(--mid)">次 →</span>
            )}
          </div>
        )}
      </div>

      <div class="read-pane" id="read-pane">
        <div class="empty-pane">
          <Icon name="mail" size={40} stroke="var(--mid)" />
          <div class="big" style="margin-top:12px">メールを選択</div>
          <div>リストからメールをクリックして表示</div>
        </div>
      </div>
    </Layout>
  )
}

export const SentPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, page, hasNext }) => (
  <FolderPage
    currentUser={currentUser}
    emails={emails}
    title="送信済み"
    active="sent"
    showTo={true}
    page={page}
    hasNext={hasNext}
    basePath="/sent"
    emptyIcon="send"
    emptyText="送信済みメールはありません"
  />
)

export const StarredPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, page, hasNext }) => (
  <FolderPage
    currentUser={currentUser}
    emails={emails}
    title="お気に入り"
    active="starred"
    page={page}
    hasNext={hasNext}
    basePath="/starred"
    emptyIcon="star"
    emptyText="お気に入りのメールはありません"
  />
)

export const TrashPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, page, hasNext }) => (
  <FolderPage
    currentUser={currentUser}
    emails={emails}
    title="ゴミ箱"
    active="trash"
    page={page}
    hasNext={hasNext}
    basePath="/trash"
    emptyIcon="trash"
    emptyText="ゴミ箱は空です"
  />
)

export const DraftsPage: FC<{ currentUser: SessionUser }> = ({ currentUser }) => (
  <Layout title="下書き" user={currentUser} active="drafts">
    <div class="list-pane">
      <div class="list-header">
        <div class="list-title-row">
          <div class="list-title">下書き</div>
        </div>
      </div>
      <div class="list-scroll">
        <div class="empty-pane" style="padding-top:60px">
          <Icon name="drafts" size={36} stroke="var(--mid)" />
          <div class="big" style="margin-top:12px">下書きはありません</div>
        </div>
      </div>
    </div>
    <div class="read-pane" id="read-pane">
      <div class="empty-pane">
        <Icon name="mail" size={40} stroke="var(--mid)" />
        <div class="big" style="margin-top:12px">メールを選択</div>
      </div>
    </div>
  </Layout>
)

export const SpamPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, page, hasNext }) => (
  <FolderPage
    currentUser={currentUser}
    emails={emails}
    title="スパム"
    active="spam"
    page={page}
    hasNext={hasNext}
    basePath="/spam"
    emptyIcon="alert"
    emptyText="スパムメールはありません"
  />
)

export const MailDetailPartial: FC<{
  id: string
  from_: string
  to_address?: string
  subject: string
  received_at: string
  body_text: string
  body_html: string | null
  attachments: AttachmentItem[]
  is_starred?: number
  is_trashed?: number
  folder?: string
}> = ({ id, from_, to_address, subject, received_at, body_text, body_html, attachments, is_starred, is_trashed, folder }) => (
  <>
    <div class="read-toolbar">
      <button
        class="tool-btn read-back-btn"
        onclick="var ma=document.getElementById('main-area');if(ma)ma.classList.remove('show-detail')"
      >
        <Icon name="arrowLeft" size={14} />
        戻る
      </button>
      {folder !== 'sent' && (
        <>
          <button
            class="tool-btn"
            hx-get={`/compose/drawer?replyTo=${id}`}
            hx-target="#compose-slot"
            hx-swap="innerHTML"
          >
            <Icon name="reply" size={14} />
            返信
          </button>
          <button
            class="tool-btn"
            hx-get={`/compose/drawer?forwardOf=${id}`}
            hx-target="#compose-slot"
            hx-swap="innerHTML"
          >
            <Icon name="forward" size={14} />
            転送
          </button>
        </>
      )}
      <div style="flex:1" />
      {/* スター（お気に入り）ボタン */}
      {is_starred === 1 ? (
        <button
          class="tool-btn icon-only"
          title="お気に入りを解除"
          hx-post={`/mail/${id}/unstar`}
          hx-target={`#read-pane`}
          hx-swap="innerHTML"
          style="color:#f59e0b"
        >
          <Icon name="star" size={15} stroke="#f59e0b" />
        </button>
      ) : (
        <button
          class="tool-btn icon-only"
          title="お気に入りに追加"
          hx-post={`/mail/${id}/star`}
          hx-target={`#read-pane`}
          hx-swap="innerHTML"
        >
          <Icon name="star" size={15} />
        </button>
      )}
      {folder !== 'sent' && (
        <button
          class="tool-btn icon-only"
          title="未読に戻す"
          hx-post={`/mail/${id}/unread`}
          hx-swap="none"
          {...({
            'hx-on::after-request': `document.getElementById('mail-row-${id}')?.classList.add('unread');document.getElementById('mail-row-${id}')?.classList.remove('active')`,
          } as object)}
        >
          <Icon name="eye" size={15} />
        </button>
      )}
      {is_trashed ? (
        <>
          <button
            class="tool-btn icon-only"
            title="受信箱に戻す"
            hx-post={`/mail/${id}/restore`}
            hx-target="#read-pane"
            hx-swap="innerHTML"
            {...({
              'hx-on::after-request': `document.getElementById('mail-row-${id}')?.remove()`,
            } as object)}
          >
            <Icon name="arrowLeft" size={15} />
          </button>
          <button
            class="tool-btn icon-only danger"
            title="完全に削除"
            hx-post={`/mail/${id}/delete`}
            hx-target="#read-pane"
            hx-swap="innerHTML"
            hx-confirm="このメールを完全に削除しますか？"
            {...({
              'hx-on::after-request': `document.getElementById('mail-row-${id}')?.remove()`,
            } as object)}
          >
            <Icon name="trash" size={15} />
          </button>
        </>
      ) : (
        <button
          class="tool-btn icon-only danger"
          title="ゴミ箱へ"
          hx-post={`/mail/${id}/trash`}
          hx-target="#read-pane"
          hx-swap="innerHTML"
          {...({
            'hx-on::after-request': `document.getElementById('mail-row-${id}')?.remove()`,
          } as object)}
        >
          <Icon name="trash" size={15} />
        </button>
      )}
    </div>

    <div class="read-body fade">
      <div class="read-subject">{subject || '(件名なし)'}</div>

      <div class="read-header">
        <div class="avatar">{senderInitials(from_)}</div>
        <div style="flex:1;min-width:0">
          <div class="read-from">
            <b>{senderName(from_)}</b>
            <span class="addr">{from_.match(/<(.+)>/)?.[1] ?? from_}</span>
          </div>
          {to_address && folder === 'sent' && (
            <div style="font-size:12px;color:var(--sub);margin-top:2px">To: {to_address}</div>
          )}
        </div>
        <div class="read-time">{received_at.slice(0, 16).replace('T', ' ')}</div>
      </div>

      {attachments.length > 0 && (
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
          {attachments.map((a) => (
            <a key={a.id} href={`/attachments/${a.id}`} class="attachment">
              <span class="attachment-icon">
                <Icon name="paperclip" size={13} />
              </span>
              {a.filename}
              <span class="attachment-size">{formatSize(a.size)}</span>
            </a>
          ))}
        </div>
      )}

      <div class="read-content">
        {body_html ? (
          <>
            <div style="display:flex;gap:6px;margin-bottom:12px">
              <button
                class="pill active"
                id="btn-html"
                onclick="document.getElementById('body-html').style.display='block';document.getElementById('body-text').style.display='none';document.getElementById('btn-html').classList.add('active');document.getElementById('btn-text').classList.remove('active')"
              >
                HTML
              </button>
              <button
                class="pill"
                id="btn-text"
                onclick="document.getElementById('body-text').style.display='block';document.getElementById('body-html').style.display='none';document.getElementById('btn-text').classList.add('active');document.getElementById('btn-html').classList.remove('active')"
              >
                テキスト
              </button>
            </div>
            <iframe
              id="body-html"
              srcdoc={body_html}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              style="width:100%;min-height:400px;border:none;display:block"
              onload="this.style.height=this.contentDocument.body.scrollHeight+32+'px'"
            />
            <pre id="body-text" style="white-space:pre-wrap;font-size:13px;line-height:1.7;display:none">{body_text}</pre>
          </>
        ) : (
          <pre style="white-space:pre-wrap;font-size:13px;line-height:1.7">{body_text}</pre>
        )}
      </div>
    </div>
  </>
)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
