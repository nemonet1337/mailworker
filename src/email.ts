import { EmailMessage } from 'cloudflare:email'
import { AppEnv } from './types'

export default {
  async email(message: EmailMessage, env: AppEnv['Bindings']): Promise<void> {
    const rawEmail = await new Response(message.raw).text()
    const subject = message.headers.get('subject') ?? '(件名なし)'
    const bodyText = extractPlainText(rawEmail)

    await env.DB.prepare(
      `INSERT INTO emails (id, message_id, to_address, from_, subject, body_text, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        message.headers.get('message-id') ?? '',
        message.to,
        message.from,
        subject,
        bodyText,
        new Date().toISOString(),
      )
      .run()
  },
}

function extractPlainText(raw: string): string {
  const match = raw.match(/Content-Type: text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(\r?\n--|\r?\n\r?\n--|$)/i)
  return match ? match[1].trim() : raw.slice(raw.indexOf('\r\n\r\n') + 4, 2000)
}
