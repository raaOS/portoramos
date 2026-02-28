export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')

    if (cfIP) return cfIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()

    return 'unknown'
}
