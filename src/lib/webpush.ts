// Web Push encryption (RFC 8291) + VAPID (RFC 8292) for Cloudflare Workers

function toBase64Url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// ES256 JWT for VAPID authorization header
async function createVapidJwt(audience: string, subject: string, privateKeyJwk: JsonWebKey): Promise<string> {
  const enc = new TextEncoder()
  const header = toBase64Url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const now = Math.floor(Date.now() / 1000)
  const body = toBase64Url(enc.encode(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })))
  const input = `${header}.${body}`
  const key = await crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(input))
  return `${input}.${toBase64Url(sig)}`
}

// RFC 8291 content encryption + send to push endpoint
export async function sendWebPush(
  endpoint: string,
  p256dhBase64: string,
  authBase64: string,
  payload: string,
  vapidPrivateKeyJwk: JsonWebKey,
  vapidPublicKeyBase64: string,
  vapidSubject: string,
): Promise<Response> {
  const enc = new TextEncoder()

  const clientPublicKeyBytes = fromBase64Url(p256dhBase64)
  const authBytes = fromBase64Url(authBase64)

  // Ephemeral server ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey) as ArrayBuffer)

  // ECDH shared secret
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', clientPublicKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharedSecretBytes = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPublicKey } as any, serverKeyPair.privateKey, 256),
  )

  // Random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Step 1: PRK_key = HKDF(ikm=ecdh_secret, salt=auth_secret, info="WebPush: info\0" + ua_pk + as_pk)
  const prkKeyInfo = new Uint8Array([
    ...enc.encode('WebPush: info\x00'),
    ...clientPublicKeyBytes,
    ...serverPublicKeyRaw,
  ])
  const sharedSecretKey = await crypto.subtle.importKey('raw', sharedSecretBytes, { name: 'HKDF' }, false, ['deriveBits'])
  const prkKeyBytes = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authBytes, info: prkKeyInfo }, sharedSecretKey, 256),
  )

  // Step 2a: CEK = HKDF(ikm=PRK_key, salt=salt, info="Content-Encoding: aes128gcm\0", len=16)
  const prkKey = await crypto.subtle.importKey('raw', prkKeyBytes, { name: 'HKDF' }, false, ['deriveBits'])
  const cekBytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: aes128gcm\x00') },
      prkKey, 128,
    ),
  )

  // Step 2b: Nonce = HKDF(ikm=PRK_key, salt=salt, info="Content-Encoding: nonce\0", len=12)
  const prkKey2 = await crypto.subtle.importKey('raw', prkKeyBytes, { name: 'HKDF' }, false, ['deriveBits'])
  const nonceBytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('Content-Encoding: nonce\x00') },
      prkKey2, 96,
    ),
  )

  // AES-128-GCM encrypt (payload + 0x02 padding delimiter)
  const paddedPayload = new Uint8Array(enc.encode(payload).length + 1)
  paddedPayload.set(enc.encode(payload))
  paddedPayload[enc.encode(payload).length] = 2

  const aesKey = await crypto.subtle.importKey('raw', cekBytes, { name: 'AES-GCM' }, false, ['encrypt'])
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceBytes }, aesKey, paddedPayload))

  // RFC 8291 binary header: salt(16) + rs(4, BE) + keyid_len(1) + server_public_key(65)
  const header = new Uint8Array(21 + serverPublicKeyRaw.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096, false)
  header[20] = serverPublicKeyRaw.length
  header.set(serverPublicKeyRaw, 21)

  const body = new Uint8Array(header.length + ciphertext.length)
  body.set(header)
  body.set(ciphertext, header.length)

  // VAPID authorization
  const url = new URL(endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKeyJwk)

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidPublicKeyBase64}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
    },
    body,
  })
}

// Generate VAPID key pair — returns { publicKey: base64url, privateKeyJwk: string }
export async function generateVapidKeys(): Promise<{ publicKey: string; privateKeyJwk: string }> {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']) as CryptoKeyPair
  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey) as ArrayBuffer)
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
  return {
    publicKey: toBase64Url(publicKeyRaw),
    privateKeyJwk: JSON.stringify(privateKeyJwk),
  }
}
