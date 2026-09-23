/**
 * Backward compatibility re-export.
 *
 * Semua fungsi AI text generation dan instance model telah disatukan
 * di '@/lib/ai' dengan multi-provider fallback (Groq → OpenRouter → Gemini).
 *
 * File ini dipertahankan agar tidak terjadi breaking changes pada
 * import lawas atau tooling yang merujuk ke '@/lib/gemini'.
 *
 * @module gemini
 */

export * from './ai';
