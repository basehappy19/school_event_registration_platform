export function getClientIp(headersObj: { get: (name: string) => string | null | undefined } | null | undefined): string {
  if (!headersObj) return '127.0.0.1'

  // 1. Cloudflare Connecting IP
  const cfIp = headersObj.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  // 2. True Client IP (Akamai / Cloudflare Enterprise)
  const trueClientIp = headersObj.get('true-client-ip')
  if (trueClientIp) return trueClientIp.trim()

  // 3. X-Real-IP (Nginx standard proxy header)
  const realIp = headersObj.get('x-real-ip')
  if (realIp) return realIp.trim()

  // 4. X-Forwarded-For (can be comma-separated list of IPs: "client_ip, proxy1, proxy2")
  const forwardedFor = headersObj.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(s => s.trim()).filter(Boolean)
    if (ips.length > 0) {
      return ips[0]
    }
  }

  // 5. X-Client-IP
  const clientIp = headersObj.get('x-client-ip')
  if (clientIp) return clientIp.trim()

  return '127.0.0.1'
}
