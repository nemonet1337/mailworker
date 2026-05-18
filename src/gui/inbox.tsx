import { FC } from 'hono/jsx'
import { Layout } from './layout'
import { SessionUser } from '../types'

type EmailRow = {
  id: string
  from_: string
  subject: string
  received_at: string
  is_read: number
}

type AttachmentItem = {
  id: string
  filename: string
  content_type: string
  size: number
}

export const InboxPage: FC<{ currentUser: SessionUser; emails: EmailRow[] }> = ({
  currentUser,
  emails,
}) => (
  <Layout title="受信箱" user={currentUser} active="inbox">
    <h1 class="text-2xl font-bold mb-4">受信箱</h1>
    {emails.length === 0 ? (
      <p class="text-gray-500">メールはありません。</p>
    ) : (
      <table class="w-full bg-white border rounded overflow-hidden text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="p-2 text-left w-6"></th>
            <th class="p-2 text-left">差出人</th>
            <th class="p-2 text-left">件名</th>
            <th class="p-2 text-left">受信日時</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((m) => (
            <tr
              key={m.id}
              class={`border-t cursor-pointer hover:bg-blue-50 ${m.is_read === 0 ? 'font-semibold' : ''}`}
              hx-get={`/mail/${m.id}`}
              hx-target="#mail-detail"
              hx-swap="innerHTML"
              {...({'hx-on::after-request': `htmx.ajax('POST','/mail/${m.id}/read',{swap:'none'})`} as object)}
            >
              <td class="p-2">{m.is_read === 0 ? '●' : ''}</td>
              <td class="p-2">{m.from_}</td>
              <td class="p-2">{m.subject}</td>
              <td class="p-2">{m.received_at.slice(0, 16).replace('T', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
    <div id="mail-detail" class="mt-6 bg-white border rounded p-4 hidden"></div>
  </Layout>
)

export const MailDetailPartial: FC<{
  from_: string
  subject: string
  received_at: string
  body_text: string
  attachments: AttachmentItem[]
}> = ({ from_, subject, received_at, body_text, attachments }) => (
  <div>
    <p class="text-xs text-gray-500 mb-1">{received_at.slice(0, 16).replace('T', ' ')}</p>
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
    <pre class="whitespace-pre-wrap text-sm border-t pt-4">{body_text}</pre>
  </div>
)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
