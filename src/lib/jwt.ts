const encoder = new TextEncoder()

type JwtPayload = {
  sub: string
  is_admin: 0 | 1
  exp: number
}

const toBase64Url = (value: string): string =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64Url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return atob(padded)
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(input))
  return toBase64Url(String.fromCharCode(...new Uint8Array(sig)))
}

export async function createJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = toBase64Url(JSON.stringify(payload))
  const input = `${header}.${body}`
  const signature = await sign(input, secret)
  return `${input}.${signature}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const [header, body, signature] = token.split('.')
  if (!header || !body || !signature) return null

  const input = `${header}.${body}`
  const expected = await sign(input, secret)
  if (expected !== signature) return null

  const payload = JSON.parse(fromBase64Url(body)) as JwtPayload
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null
  return payload
}
