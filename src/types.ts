export type AppEnv = {
  Bindings: {
    DB: D1Database
    JWT_SECRET: string
    MAIL_DOMAIN: string
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
