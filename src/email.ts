import { AppEnv } from './types'
import { decodeQuotedPrintable, decodeRfc2047, fallbackText, base64Decode } from './lib/mime'

export default {
  async email(message: ForwardableEmailMessage, env: AppEnv['Bindings']): Promise<void> {
    const rawBuf = await new Response(message.raw).arrayBuffer()
    // latin1 で 1:1 バイト往復可能な文字列に
    const rawLatin1 = new TextDecoder('latin1').decode(rawBuf)
    const subject = decodeRfc2047(message.headers.get('subject') ?? '(件名なし)')
    const fromHeader = decodeRfc2047(message.headers.get('from') ?? message.from)
    const messageId = message.headers.get('message-id') ?? ''
    const emailId = crypto.randomUUID()
    const now = new Date().toISOString()

    const parts = parseMime(rawLatin1)

    const plainPart = parts.find(p => mimeMainType(p) === 'text/plain')
    const htmlPart = parts.find(p => mimeMainType(p) === 'text/html')

    const bodyText = plainPart
      ? decodePartBody(plainPart).trim() || fallbackText(rawLatin1)
      : fallbackText(rawLatin1)
    const bodyHtml = htmlPart ? decodePartBody(htmlPart).trim() || null : null

    await env.DB.prepare(
      `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, body_html, received_at, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
    ).bind(
      emailId, messageId, message.to.toLowerCase(), fromHeader || message.from,
      subject, bodyText, bodyHtml, now,
    ).run()

    const stmts: D1PreparedStatement[] = []
    const puts: Promise<unknown>[] = []

    for (const part of parts) {
      const mainType = mimeMainType(part)
      if (mainType.startsWith('text/') || mainType.startsWith('multipart/')) continue

      const filename = extractFilename(part.headers) || 'attachment'
      const disp = (part.headers['content-disposition'] ?? '').toLowerCase()
      // inline 画像などで disposition が無くても非 text は添付扱い
      if (disp.includes('inline') && !disp.includes('filename')) continue

      const content = decodePartBytes(part)
      const attachmentId = crypto.randomUUID()
      const r2Key = `attachments/${emailId}/${attachmentId}`

      puts.push(env.BUCKET.put(r2Key, content, {
        httpMetadata: { contentType: mainType || 'application/octet-stream' },
      }))
      stmts.push(env.DB.prepare(
        `INSERT INTO attachments (id, email_id, filename, content_type, size, r2_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        attachmentId, emailId, filename,
        mainType || 'application/octet-stream',
        content.byteLength, r2Key, now,
      ))
    }

    await Promise.all(puts)
    if (stmts.length) await env.DB.batch(stmts)
  },
}

// ── MIME パーサー ───────────────────────────────────────────────

type Part = { headers: Record<string, string>; body: string }

function parseMime(raw: string, depth = 0): Part[] {
  if (depth > 4) return []

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
    if (s.startsWith('--')) break
    results.push(...parseMime(s, depth + 1))
  }

  return results
}

function parseHeaders(text: string): Record<string, string> {
  const h: Record<string, string> = {}
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

function charsetOf(part: Part): string {
  const ct = part.headers['content-type'] ?? ''
  const m = ct.match(/charset\s*=\s*(?:"([^"]+)"|([^\s;]+))/i)
  return (m?.[1] ?? m?.[2] ?? 'utf-8').replace(/^['"]|['"]$/g, '').toLowerCase()
}

function decodePartBytes(part: Part): Uint8Array {
  const encoding = (part.headers['content-transfer-encoding'] ?? '').toLowerCase().trim()
  if (encoding === 'base64') {
    return base64Decode(part.body.replace(/\s+/g, ''))
  }
  if (encoding === 'quoted-printable') {
    return decodeQuotedPrintable(part.body)
  }
  // 7bit / 8bit / binary / 未指定: latin1 ボディをバイト列に戻す
  return latin1ToBytes(part.body)
}

function decodePartBody(part: Part): string {
  const bytes = decodePartBytes(part)
  const cs = charsetOf(part)
  try {
    return new TextDecoder(cs).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function extractFilename(headers: Record<string, string>): string {
  const disp = headers['content-disposition'] ?? ''
  // RFC 2231 filename*=UTF-8''...
  let m = disp.match(/filename\*\s*=\s*(?:UTF-8|utf-8)''([^;\s]+)/i)
  if (m) {
    try {
      return sanitizeFilename(decodeURIComponent(m[1]))
    } catch {
      return sanitizeFilename(m[1])
    }
  }
  m = disp.match(/filename\*?=(?:UTF-8'')?(?:"([^"]+)"|([^;\s]+))/i)
  if (m) return sanitizeFilename(decodeRfc2047(decodeURIComponentSafe(m[1] ?? m[2])))

  const ct = headers['content-type'] ?? ''
  m = ct.match(/name=(?:"([^"]+)"|([^;\s]+))/i)
  if (m) return sanitizeFilename(decodeRfc2047(m[1] ?? m[2]))

  return ''
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\]/g, '_').replace(/[\x00-\x1f]/g, '').slice(0, 255)
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function latin1ToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff
  return bytes
}
