/** quoted-printable → 生バイト */
export function decodeQuotedPrintable(s: string): Uint8Array {
  const t = s.replace(/=\r?\n/g, '')
  const out: number[] = []
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(t.slice(i + 1, i + 3))) {
      out.push(parseInt(t.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      out.push(t.charCodeAt(i) & 0xff)
    }
  }
  return new Uint8Array(out)
}

function base64Decode(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** RFC 2047 encoded-word デコード (件名・From・filename) */
export function decodeRfc2047(s: string): string {
  if (!s || !/=\?/.test(s)) return s
  const collapsed = s.replace(/(\?=\s+=\?)/g, '?==?')
  return collapsed.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_m, charset: string, enc: string, data: string) => {
      try {
        let bytes: Uint8Array
        if (enc.toUpperCase() === 'B') {
          bytes = base64Decode(data.replace(/\s+/g, ''))
        } else {
          const q = data.replace(/_/g, ' ')
          bytes = decodeQuotedPrintable(q)
        }
        const cs = charset.toLowerCase()
        try {
          return new TextDecoder(cs).decode(bytes)
        } catch {
          return new TextDecoder('utf-8').decode(bytes)
        }
      } catch {
        return _m
      }
    },
  )
}

export function fallbackText(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n')
  const idx = normalized.indexOf('\n\n')
  if (idx === -1) return normalized.slice(0, 2000)
  return normalized.slice(idx + 2, idx + 2 + 2000)
}

export { base64Decode }
