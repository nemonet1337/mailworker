/**
 * MIME デコードの簡易テスト (フレームワーク不要)
 * 実行: npm test
 */
import { decodeQuotedPrintable, decodeRfc2047, fallbackText } from './lib/mime'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error('FAIL: ' + msg)
  console.log('ok:', msg)
}

// ── quoted-printable ──────────────────────────────────────────
{
  const raw = 'Use a fas=\nt model for classification,=E2=80=87'
  const bytes = decodeQuotedPrintable(raw)
  const text = new TextDecoder('utf-8').decode(bytes)
  assert(
    text.includes('Use a fast model for classification,'),
    'QP soft-break + figure space decodes to readable text',
  )
  assert(!text.includes('=E2=80=87'), 'QP hex sequences are not left raw')
}

{
  const raw = 'attr=3D"Open"'
  const text = new TextDecoder('utf-8').decode(decodeQuotedPrintable(raw))
  assert(text === 'attr="Open"', 'QP =3D becomes =')
}

// ── RFC 2047 ──────────────────────────────────────────────────
{
  const encoded = '=?UTF-8?B?44GT44KT44Gr44Gh44Gv?='
  const decoded = decodeRfc2047(encoded)
  assert(decoded === 'こんにちは', 'RFC2047 B-encoding UTF-8')
}

{
  const encoded = '=?UTF-8?Q?Hello_=E2=9C=93?='
  const decoded = decodeRfc2047(encoded)
  assert(decoded.includes('Hello'), 'RFC2047 Q-encoding')
}

// ── fallbackText ──────────────────────────────────────────────
{
  const header = 'A'.repeat(2500)
  const raw = header + '\n\nbody starts here and continues'
  const fb = fallbackText(raw)
  assert(fb.startsWith('body starts here'), 'fallbackText uses end index not absolute 2000')
  assert(fb.length > 0, 'fallbackText non-empty when header > 2000')
}

console.log('\nAll email tests passed.')
