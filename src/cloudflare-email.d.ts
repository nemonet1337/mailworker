// Cloudflare Workers runtime で new EmailMessage(from, to, raw) として使用可能
// @cloudflare/workers-types は EmailMessage をインターフェースとしか定義していないため補完
declare var EmailMessage: {
  new (from: string, to: string, raw: ReadableStream<Uint8Array>): EmailMessage
}
