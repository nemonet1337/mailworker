export async function checkRateLimit(limiter: RateLimit, key: string): Promise<boolean> {
  const { success } = await limiter.limit({ key })
  return success
}
