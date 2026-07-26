export type AppEnv = {
  Bindings: {
    DB: D1Database
    BUCKET: R2Bucket
    JWT_SECRET: string
    MAIL_DOMAIN: string
    SEND_EMAIL: SendEmail
    RATE_LIMITER: RateLimit
  }
  Variables: {
    user?: SessionUser
  }
}

export type SessionUser = {
  id: string
  email: string
  display_name: string
  is_admin: 0 | 1
}

export type EmailRow = {
  id: string
  from_: string
  to_address?: string
  subject: string
  received_at: string
  is_read: number
  is_starred?: number
  is_trashed?: number
  folder?: string
  body_text?: string
  scheduled_at?: string | null
  send_attempts?: number
}

export type MailDetail = {
  id: string
  from_: string
  to_address: string
  subject: string
  received_at: string
  body_text: string
  body_html: string | null
  is_starred: number
  is_trashed: number
  folder: string
  scheduled_at?: string | null
}
