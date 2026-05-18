import { AppEnv } from './types'

export default {
  async email(message: ForwardableEmailMessage, env: AppEnv['Bindings']): Promise<void> {
    const rawEmail = await new Response(message.raw).text()
    const subject = message.headers.get('subject') ?? '(件名なし)'
    const messageId = message.headers.get('message-id') ?? ''
    const emailId = crypto.randomUUID()
    const now = new Date().toISOString()

    const parts = parseMime(rawEmail)

    const bodyText = parts.find(p => mimeMainType(p) === 'text/plain')?.body.trim()
      ?? fallbackText(rawEmail)
    const bodyHtml = parts.find(p => mimeMainType(p) === 'text/html')?.body.trim() ?? null

    await env.DB.prepare(
      `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, body_html, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(emailId, messageId, message.to, message.from, subject, bodyText, bodyHtml, now).run()

    // 添付ファイルを R2 に保存
    for (const part of parts) {
      const mainType = mimeMainType(part)
      if (mainType.startsWith('text/') || mainType.startsWith('multipart/')) continue

      const filename = extractFilename(part.headers) || 'attachment'
      const disp = (part.headers['content-disposition'] ?? '').toLowerCase()
      if (!disp.includes('attachment') && mainType.startsWith('text/')) continue

      const encoding = (part.headers['content-transfer-encoding'] ?? '').toLowerCase().trim()
      const content = encoding === 'base64'
        ? base64Decode(part.body.replace(/\s+/g, ''))
        : new TextEncoder().encode(part.body)

      const attachmentId = crypto.randomUUID()
      // R2 キーにユーザー入力のファイル名を含めない (パストラバーサル対策)
      const r2Key = `attachments/${emailId}/${attachmentId}`

      await env.BUCKET.put(r2Key, content, {
        httpMetadata: { contentType: mainType || 'application/octet-stream' },
      })

      await env.DB.prepare(
        `INSERT INTO attachments (id, email_id, filename, content_type, size, r2_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        attachmentId, emailId, filename,
        mainType || 'application/octet-stream',
        content.byteLength, r2Key, now,
      ).run()
    }
  },
}

// ── MIME パーサー ───────────────────────────────────────────────

type Part = { headers: Record<string, string>; body: string }

function parseMime(raw: string, depth = 0): Part[] {
  if (depth > 4) return []

  // \r\n を \n に正規化
  const text = raw.replace(/\r\n/g, '\n')
  const sep = text.indexOf('\n\n')
  if (sep === -1) return []

  const headers = parseHeaders(text.slice(0, sep))
  const body = text.slice(sep + 2)
  const ct = headers['content-type'] ?? 'text/plain'

  if (!ct.split(';')[0].trim().toLowerCase().startsWith('multipart/')) {
    return [{ headers, body }]
  }

  const m = ct.match(/boundary=(?:"([^"]+)"|(\S+?)(?:;|$))/i)
  if (!m) return [{ headers, body }]

  const boundary = m[1] ?? m[2]
  const results: Part[] = []

  for (const section of body.split(new RegExp(`\n--${escapeRe(boundary)}`)).slice(1)) {
    const s = section.replace(/^\n/, '')
    if (s.startsWith('--')) break  // 終端デリミタ
    results.push(...parseMime(s, depth + 1))
  }

  return results
}

function parseHeaders(text: string): Record<string, string> {
  const h: Record<string, string> = {}
  // ヘッダー折り返し (RFC 2822) を展開してから解析
  for (const line of text.replace(/\n[ \t]+/g, ' ').split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    h[line.slice(0, idx).toLowerCase().trim()] = line.slice(idx + 1).trim()
  }
  return h
}

function mimeMainType(part: Part): string {
  return (part.headers['content-type'] ?? 'text/plain').split(';')[0].trim().toLowerCase()
}

function extractFilename(headers: Record<string, string>): string {
  // Content-Disposition: attachment; filename="foo.png"
  const disp = headers['content-disposition'] ?? ''
  let m = disp.match(/filename\*?=(?:UTF-8'')?(?:"([^"]+)"|([^;\s]+))/i)
  if (m) return sanitizeFilename(decodeURIComponent(m[1] ?? m[2]))

  // Content-Type: image/png; name="foo.png"
  const ct = headers['content-type'] ?? ''
  m = ct.match(/name=(?:"([^"]+)"|([^;\s]+))/i)
  if (m) return sanitizeFilename(m[1] ?? m[2])

  return ''
}

// パストラバーサル対策: パス区切り文字と制御文字を除去
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\]/g, '_').replace(/[\x00-\x1f]/g, '').slice(0, 255)
}

function fallbackText(raw: string): string {
  const idx = raw.indexOf('\r\n\r\n')
  return idx !== -1 ? raw.slice(idx + 4, 2000) : raw.slice(0, 2000)
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function base64Decode(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
