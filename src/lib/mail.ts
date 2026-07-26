/** "Name <addr@x.com>" → "addr@x.com" */
export function extractEmailAddr(from: string): string {
  return from.match(/<([^>]+)>/)?.[1]?.trim() ?? from.trim()
}

export function parsePage(q: string | undefined): number {
  return Math.max(1, Number(q ?? '1') || 1)
}

export const PAGE_SIZE = 50
