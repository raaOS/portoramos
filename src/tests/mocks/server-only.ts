/**
 * Mock untuk module `server-only` di environment test (Vitest + jsdom).
 *
 * Module `server-only` sengaja melempar error saat di-import di client/test
 * environment. Alias ini (dikonfigurasi di `vitest.config.ts`) mengarahkan
 * import `server-only` ke file kosong ini sehingga module yang menggunakan
 * `import 'server-only'` tetap bisa di-test tanpa error.
 *
 * @see vitest.config.ts — alias configuration
 */
export {};
