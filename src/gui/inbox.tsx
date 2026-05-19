import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { SessionUser, EmailRow } from '../types'

type AttachmentItem = {
  id: string
  filename: string
  content_type: string
  size: number
}

export const InboxRows: FC<{ emails: EmailRow[]; addr?: string }> = ({ emails, addr }) => (
  <tbody
    id="inbox-tbody"
    hx-get={addr ? `/inbox/rows?addr=${encodeURIComponent(addr)}` : '/inbox/rows'}
    hx-trigger="every 30s"
    hx-target="#inbox-tbody"
    hx-swap="outerHTML"
  >
    {emails.length === 0 ? (
      <tr><td colspan={3} class="p-4 text-center text-gray-500">メールはありません。</td></tr>
    ) : (
      emails.map((m) => (
        <tr key={m.id} id={`mail-row-${m.id}`} class={`border-t ${m.is_read === 0 ? 'font-semibold' : ''}`}>
          <td class="p-2">{m.is_read === 0 ? '●' : ''}</td>
          <td
            class="p-2 cursor-pointer hover:bg-blue-50"
            hx-get={`/mail/${m.id}`}
            hx-target="#mail-detail"
            hx-swap="innerHTML"
            {...({'hx-on::after-request': `htmx.ajax('POST','/mail/${m.id}/read',{swap:'none'})`} as object)}
          >
            <span class="block text-xs text-gray-500">{m.from_}</span>
            <span>{m.subject}</span>
            <span class="block text-xs text-gray-400">{m.received_at.slice(0, 16).replace('T', ' ')}</span>
          </td>
          <td class="p-2">
            <button
              hx-post={`/mail/${m.id}/delete`}
              hx-target={`#mail-row-${m.id}`}
              hx-swap="outerHTML swap:0.3s"
              hx-confirm="このメールを削除しますか？"
              class="text-red-500 text-xs hover:underline"
            >
              削除
            </button>
          </td>
        </tr>
      ))
    )}
  </tbody>
)

export const InboxPage: FC<{
  currentUser: SessionUser
  emails: EmailRow[]
  addresses: string[]
  selectedAddr: string
  page: number
  hasNext: boolean
}> = ({ currentUser, emails, addresses, selectedAddr, page, hasNext }) => {
  const qs = (p: number) => {
    const params = new URLSearchParams()
    if (selectedAddr) params.set('addr', selectedAddr)
    params.set('page', String(p))
    return `/?${params.toString()}`
  }
  return (
    <Layout title="受信箱" user={currentUser} active="inbox">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">受信箱</h1>
        {addresses.length > 1 && (
          <form method="get" action="/" class="flex items-center gap-2 text-sm">
            <label class="text-gray-600">表示アドレス:</label>
            <select name="addr" onchange="this.form.submit()" class="border rounded px-2 py-1 text-sm">
              <option value="" selected={selectedAddr === ''}>すべて</option>
              {addresses.map((a) => (
                <option value={a} key={a} selected={selectedAddr === a}>{a}</option>
              ))}
            </select>
          </form>
        )}
      </div>
      <table class="w-full bg-white border rounded overflow-hidden text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="p-2 text-left w-6"></th>
            <th class="p-2 text-left">差出人 / 件名 / 日時</th>
            <th class="p-2 w-10"></th>
          </tr>
        </thead>
        <InboxRows emails={emails} addr={selectedAddr || undefined} />
      </table>
      <div class="flex items-center gap-3 mt-4 text-sm">
        {page > 1 && (
          <a href={qs(page - 1)} class="px-3 py-1 border rounded hover:bg-gray-50">← 前のページ</a>
        )}
        <span class="text-gray-500">{page} ページ目</span>
        {hasNext && (
          <a href={qs(page + 1)} class="px-3 py-1 border rounded hover:bg-gray-50">次のページ →</a>
        )}
      </div>
      <div id="mail-detail" class="mt-6 bg-white border rounded p-4 [&:empty]:hidden"></div>
    </Layout>
  )
}

export const MailDetailPartial: FC<{
  id: string
  from_: string
  subject: string
  received_at: string
  body_text: string
  body_html: string | null
  attachments: AttachmentItem[]
}> = ({ id, from_, subject, received_at, body_text, body_html, attachments }) => (
  <div>
    <div class="flex items-start justify-between mb-1">
      <p class="text-xs text-gray-500">{received_at.slice(0, 16).replace('T', ' ')}</p>
      <button
        hx-post={`/mail/${id}/unread`}
        hx-swap="none"
        {...({'hx-on::after-request': `document.getElementById('mail-row-${id}')?.classList.add('font-semibold')`} as object)}
        class="text-xs text-gray-400 hover:underline"
      >
        未読に戻す
      </button>
    </div>
    <h2 class="text-lg font-bold mb-1">{subject}</h2>
    <p class="text-sm text-gray-600 mb-4">From: {from_}</p>
    {attachments.length > 0 && (
      <div class="flex flex-wrap gap-2 mb-4 pb-4 border-b">
        {attachments.map((a) => (
          <a
            key={a.id}
            href={`/attachments/${a.id}`}
            class="inline-flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 border rounded px-3 py-1"
          >
            <span>📎</span>
            <span>{a.filename}</span>
            <span class="text-gray-400 text-xs ml-1">({formatSize(a.size)})</span>
          </a>
        ))}
      </div>
    )}
    {body_html ? (
      <div class="border-t pt-4">
        <div class="flex gap-3 text-xs mb-2">
          <button
            class="underline text-blue-600"
            onclick="document.getElementById('body-html').classList.remove('hidden');document.getElementById('body-text').classList.add('hidden')"
          >
            HTML表示
          </button>
          <button
            class="underline text-blue-600"
            onclick="document.getElementById('body-text').classList.remove('hidden');document.getElementById('body-html').classList.add('hidden')"
          >
            テキスト表示
          </button>
        </div>
        <iframe
          id="body-html"
          srcdoc={body_html}
          sandbox="allow-same-origin"
          class="w-full min-h-[400px] border rounded"
          onload="this.style.height=this.contentDocument.body.scrollHeight+32+'px'"
        />
        <pre id="body-text" class="whitespace-pre-wrap text-sm hidden">{body_text}</pre>
      </div>
    ) : (
      <pre class="whitespace-pre-wrap text-sm border-t pt-4">{body_text}</pre>
    )}
  </div>
)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
