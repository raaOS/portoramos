/**
 * Security utilities barrel re-export.
 *
 * Mengagregasi fungsi-fungsi keamanan dari modul `request.ts`
 * agar dapat di-import melalui `@/lib/security/utils` atau
 * barrel utama `@/lib/security`.
 *
 * @module security/utils
 * @see {@link ./request} untuk implementasi asli
 */
export { getClientIP, getClientIdentifier, enforceRequestRateLimit } from './request';
