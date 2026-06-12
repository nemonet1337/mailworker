export type AppEnv = {
  Bindings: {
    DB: D1Database
    BUCKET: R2Bucket
    JWT_SECRET: string
    MAIL_DOMAIN: string
    SEND_EMAIL: SendEmail
    RATE_LIMITER: RateLimit
    // wrangler.toml の [[queues.producers]] を有効化した場合のみバインドされる
    MAIL_QUEUE?: Queue
  }
  Variables: {
    user?: SessionUser
    isAuthed?: boolean
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
  subject: string
  received_at: string
  is_read: number
  body_text?: string
}

export type AttachmentRow = {
  id: string
  email_id: string
  filename: string
  content_type: string
  size: number
  r2_key: string
  created_at: string
}
