# AGENTS.md - AI Coding Agent Guide

> Panduan teknis untuk AI coding agent yang bekerja di repo `portfolio-shared`.
> Dokumen ini harus mencerminkan kondisi repo saat ini, bukan asumsi lama.

---

## Project Overview

**portfolio-shared** adalah personal portfolio berbasis **Next.js App Router** dengan pengalaman utama berupa desktop interface bergaya macOS. Homepage tidak memakai navigasi landing page konvensional; user masuk ke desktop interaktif dengan window system, dock, wallpaper, audio feedback, notifikasi, dan elemen chat/testimonial.

### Karakteristik Utama

- **Bahasa utama:** Indonesian (Bahasa Indonesia) dengan dukungan dictionary English di `src/dictionaries/`
- **Framework:** Next.js 16.2.x + React 19
- **Rendering:** Server Components by default, Client Components untuk area interaktif berat
- **Styling:** Tailwind CSS + CSS variables + utilitas `clsx` / `tailwind-merge`
- **Deployment target:** Vercel
- **Middleware entry:** `src/proxy.ts` (bukan `middleware.ts`)

### UX Utama

Route `/` merender desktop fullscreen yang menampilkan:

- draggable desktop icons
- window chrome ala macOS
- dock dengan aplikasi/shortcut
- dynamic wallpaper dan blur layers
- sound effects untuk startup/interaksi
- notifikasi gaya Dynamic Island
- chat/testimonial UI bergaya messaging app
- data project, skill, experience, dan about yang di-load paralel

---

## Technology Stack

### Core

| Technology   | Current Version | Catatan                                        |
| ------------ | --------------- | ---------------------------------------------- |
| Next.js      | `^16.2.1`       | App Router, `proxy.ts`, React Compiler enabled |
| React        | `^19.2.1`       | UI runtime                                     |
| TypeScript   | `^5.4.5`        | `strict: true`                                 |
| Tailwind CSS | `^3.4.7`        | Utility-first styling                          |

### Dependencies Penting

- **Animation:** `framer-motion`, `lottie-react`
- **Smooth Scroll:** `lenis`
- **State/Data Fetching:** `@tanstack/react-query`, `swr`
- **Icons:** `lucide-react`, `@tabler/icons-react`
- **3D / Canvas:** `three`, `@react-three/fiber`, `@react-three/drei`
- **Particles:** `@tsparticles/react`, `@tsparticles/slim`, `@tsparticles/engine`
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Charts:** `recharts`
- **Media / Export:** `sharp`, `html-to-image`, `jspdf`, `jspdf-autotable`
- **Video / FFmpeg:** `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/util`, `ffmpeg-static`, `fluent-ffmpeg`
- **Image Cropping:** `react-easy-crop`
- **Layout:** `react-masonry-css`
- **QR Code:** `qrcode.react`
- **Slider:** `rc-slider`
- **Validation / Utility:** `zod`, `date-fns`, `uuid`, `fuse.js`
- **JWT:** `jsonwebtoken`
- **Web Performance:** `web-vitals`, `@vercel/speed-insights`

### External Services

- **AI:** Gemini via `@google/generative-ai`
- **Cloudflare:** D1 untuk data aplikasi dan R2 untuk media
- **Telegram:** main/CS bot untuk visitor/admin reply + OTP; job hunter bot untuk `/scan` dan `/cek`
- **Analytics / Perf:** `@vercel/speed-insights`, custom web vitals hooks (`PerformanceMonitor`, `WebVitals`)

### Migration Status

Repo ini sudah dimigrasikan dari Firebase ke Cloudflare. Backend data aktif adalah **Cloudflare D1** dan backend media aktif adalah **Cloudflare R2**. Jangan menambahkan kembali SDK, env, aturan, script, atau dokumentasi operasional Firebase untuk data maupun media.

### Tooling

- **Linting:** ESLint 9 flat config (`eslint.config.mjs`)
- **Testing:** Vitest 4.x + Playwright 1.55.x
- **Bundle analysis:** `@next/bundle-analyzer`
- **Critical CSS:** `critters` (devDependency)
- **Compiler optimization:** `reactCompiler: true` di `next.config.mjs`
- **Git hooks:** Husky (`prepare`)

---

## Current Project Structure

Struktur berikut adalah representasi folder yang memang ada saat ini:

```text
src/
|-- app/                    # App Router routes dan API routes
|   |-- @modal/
|   |-- about/
|   |-- (site)/             # Route group untuk homepage & public routes
|   |-- admin/
|   |-- api/                # 30 API route directories
|   |-- lab/                # Lab/eksperimen route (kosong)
|   |-- favicon.ico/
|   |-- sw.js/              # Service worker route
|   |-- error.tsx
|   |-- fonts.ts            # Font definitions
|   |-- globals.css
|   |-- layout.tsx
|   |-- loading.tsx
|   |-- not-found.tsx
|   |-- page.tsx
|   |-- robots.ts           # SEO robots
|   `-- sitemap.ts          # SEO sitemap
|-- components/
|   |-- admin/
|   |-- canvas/             # 3D / infinite canvas / project view
|   |-- chat/               # Chat/messaging components
|   |-- error/
|   |-- features/
|   |-- home/
|   |-- layout/             # MasonryGrid, SmoothScroll, dll.
|   |-- os/                 # Desktop OS system utama (pindahan dari app/about)
|   |-- projects/
|   |-- shared/             # PerformanceMonitor, WebVitals, dll.
|   `-- ui/
|-- constants/              # skillIcons.tsx
|-- contexts/               # 6 root-level contexts
|-- data/                   # JSON/TS seed/fallback content (17 files)
|-- dictionaries/
|-- hooks/                  # 11 use* hooks + index.ts + canvas/ dan window-manager/ sub-dir
|-- lib/
|   |-- __tests__/
|   |-- cache/              # CacheManager.ts
|   |-- security/           # 9 security files (rate-limit, sanitization, dll.)
|   |-- services/           # 16 service files + project/ dan __tests__/ sub-dir
|   |-- telegram/
|   |-- utils/
|   `-- validations/        # adminCrud, project, schemas, index (Zod schemas per-domain)
|-- middleware/             # auth.ts, csrf.ts, constants.ts, utils.ts
|-- styles/                 # animations.css, chat-ascii.css, layout-utilities.css
|-- tests/
|-- types/                  # 13 type definition files
|-- utils/                  # blurDataURL, canvas-helpers, cropImage
`-- proxy.ts                # Request interception entry for Next.js 16

scripts/
|-- core/                   # Development entry points (dev.js)
|-- deploy/                 # Deployment verification and scripts
|-- explorer/               # Explorer data management (seed, cleanup)
|-- generators/             # Content and data generators
|-- maintenance/            # System audit, health checks, and integrity
|-- media/                  # Asset optimization and sound generation
|-- performance/            # Bundle analysis and Lighthouse workflows
|-- security/               # Env validation and password utilities
|-- test/                   # Specialized test utilities
|-- utils/                  # Generic script utilities
`-- (various CLI tools)

tests/e2e/                  # Playwright E2E specs
public/                     # Assets, sounds, wallpapers, ffmpeg, css, fonts
```

### Catatan Struktur

- `src/proxy.ts` adalah entry request pipeline untuk auth, CSRF, dan security headers.
- `src/components/os/` adalah pusat implementasi desktop environment (bukan `src/app/about/_components/os/` seperti dokumen versi lama).
- `src/components/canvas/` berisi eksperimen dan tampilan 3D/canvas yang sudah punya test sendiri.
- `src/data/*.json` dan `src/data/*.ts` masih dipakai sebagai fallback/seed dan untuk beberapa service/utilitas yang membaca langsung data lokal.
- `/api/explorer` dan service `explorerService` tersedia untuk file-explorer virtual di admin panel.

### OS Desktop Environment Detail

`src/components/os/` memiliki sub-struktur berikut:

```text
os/
|-- context/                # DesktopWindowContext, UnifiedZIndexContext, OSSystemContext
|-- contexts/               # LayoutPersistenceContext
|-- core/                   # DesktopEnvironment, DesktopProviders, Dock, MenuBar, OSDock, Spotlight
|-- data/                   # mockChats
|-- hooks/                  # 11 hooks (boot, chat, icons, layout, lock, navigation, shortcuts, ...)
|-- layers/                 # DesktopIconsLayer, UIOverlaysLayer, UnifiedLayer, WindowsLayer
|-- sections/               # AboutTab, ArchiveTab, CVTab, InterestsTab, PhilosophyTab
|-- ui/                     # 12+ UI components + elements/, hooks/, retro/ sub-dir
|   |-- elements/           # DesktopIcon, DraggableStickyNote, StickyNoteItem, dll.
|   |-- hooks/
|   `-- retro/              # RetroViews (retro mobile overlay)
|-- utils/                  # SoundManager, chatUtils, desktopLayoutUtils, dockUtils, positionSync, windowFactory, windowMotion
`-- windows/                # Window, AboutContent, ChatWindow, ContactWindow, MacFolder, PasswordModal, DesktopErrorBoundary
    |-- components/
    `-- hooks/              # useWindowKeyboard, useWindowResize
```

### API Routes Overview

30 API route directories di `src/app/api/`:

| Kategori             | Routes                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Content CRUD**     | `about`, `experience`, `hard-skills`, `projects`, `testimonial`, `running-text`, `sticky-notes`, `gallery` |
| **Chat / Messaging** | `chat`, `comments`, `contact`, `feedback`, `webhook`                                                       |
| **AI**               | `ai`, `translate`                                                                                          |
| **Admin**            | `admin`                                                                                                    |
| **Media**            | `media`, `upload`, `img`                                                                                   |
| **System**           | `analytics`, `health`, `debug`, `empty`, `os`, `revalidate`, `utils`                                       |
| **Data**             | `leads`, `metrics`, `settings`, `explorer`                                                                 |

---

## Build and Development Commands

### Development

```bash
npm run dev
npm run dev:webpack
npm run fresh-start
npm run ultra-fresh
npm run kill-cache
```

### Build / Run

```bash
npm run build
npm run build:clean
npm run start
npm run pre-deploy
npm run deploy
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
```

### Utility

```bash
npm run lint
npm run clear-cache
npm run fix-webpack
npm run ultra-clean
npm run audit
```

### Telegram Bot CLI

Repo punya dua bot Telegram independen dengan batas command yang sengaja
minimal:

- **main / CS bot** (`@WebPortofolioBot`, token `TELEGRAM_BOT_TOKEN`) untuk
  chat visitor, admin reply, notifikasi security/login, OTP approval, dan
  command admin `/ai` saja.
- **job hunter bot** (`@ramos_job_hunter_bot`, token `JOB_BOT_TELEGRAM_TOKEN`)
  untuk command `/scan` dan `/cek` saja di topic Job Hunter
  (`JOB_BOT_THREAD_ID`).

Jangan menambahkan command job hunting ke main bot. Jangan menambahkan command
CS/security ke job hunter bot. Kalau dua bot berada dalam group yang sama,
`JOB_BOT_THREAD_ID` adalah pagar topic untuk job hunter; main bot harus
mengabaikan topic tersebut.

Halaman admin `/admin/telegram` sengaja **tidak** ada — manajemen webhook
dilakukan via CLI di bawah ini supaya tidak ada misclick "Fix Webhook"
yang nge-set webhook prod saat dev di lokal. Default semua command jalan
ke kedua bot; pakai `--bot=main` atau `--bot=job` untuk satu bot saja.

```bash
# cek status webhook + pending updates kedua bot
npm run telegram:webhook-info
npm run telegram:webhook-info -- --bot=main
npm run telegram:webhook-info -- --bot=job

# set webhook ke NEXT_PUBLIC_SITE_URL dan drop pending update by default
# (override base pakai --base=https://..., atau tambah --keep-pending bila perlu)
npm run telegram:set-webhook
npm run telegram:set-webhook -- --base=https://yourdomain.com

# clear pending queue manual (drop+restore webhook secara aman)
npm run telegram:clear-pending
```

#### Job Hunter Bot di lokal

Saat `npm run dev` dijalankan, orchestrator otomatis spawn job hunter
poller bersamaan dengan Next.js dev server (selama `JOB_BOT_TELEGRAM_TOKEN`
ada di `.env.local`). Tanpa ini, callback dari tombol hasil `/scan` dan
`/cek` di Telegram tidak terdeliver karena webhook job bot tidak ter-set
ke localhost.

Sebelum poller lokal aktif, orchestrator otomatis memanggil Telegram
`deleteWebhook` dengan `drop_pending_updates=true` supaya tidak ada pending
queue lama dan tidak bentrok dengan mode webhook production. Saat dev process
berhenti normal (Ctrl+C / Next dev mati), orchestrator mengembalikan webhook
job bot ke URL webhook sebelumnya, atau ke URL HTTPS production dari
`JOB_BOT_WEBHOOK_BASE_URL` / `NEXT_PUBLIC_SITE_URL` bila sebelumnya belum
ada webhook. Kalau proses dimatikan paksa sebelum restore, jalankan
`npm run telegram:set-webhook -- --bot=job`.

Selama local polling aktif, `scripts/core/dev.js` menulis lease heartbeat ke
D1 key `telegramJobBotLocalLease`. External watchdog/cron pihak ketiga
menembak `/api/cron/telegram-watchdog` setiap 5 menit dan route tersebut
hanya restore webhook job bot kalau lease sudah expired atau tidak ada.
Ini mencegah watchdog merebut webhook saat local dev masih sengaja berjalan,
sekaligus memulihkan production bila terminal/PC mati tanpa Ctrl+C.

Output kedua proses di-prefix: `[next]` untuk Next.js, `[job-bot]` untuk
poller. Poller auto-restart kalau crash dengan exponential backoff. Setelah
restore webhook berhasil, log dev menampilkan dua command bantuan:
`npm run telegram:webhook-info` untuk cek status/pending dan
`npm run telegram:set-webhook -- --bot=job` untuk recovery manual.
Indikator Watchdog di admin menubar membaca status nyata dari
`/api/admin/telegram-watchdog-status` (webhook Telegram, pending update,
lease local, dan last watchdog run), sementara badge `cron-job.org` di popout
hanya visual pendukung scheduler external.
Indikator D1 membaca `/api/health` dan menampilkan latency read D1 asli.
Indikator Network menggabungkan `navigator.onLine` dengan ping `/api/health`
agar bisa membedakan browser offline, API tidak terjangkau, dan API degraded.

```bash
# default: dev server + job hunter poller
npm run dev

# skip poller (mis. saat offline atau test tanpa Telegram)
npm run dev -- --no-job-bot

# poller saja, tanpa Next.js (jarang dipakai)
npm run job-bot:poll
```

### Catatan Script

- `npm run dev` menjalankan `node scripts/core/dev.js` untuk server development (auto-spawn job hunter Telegram poller bila `JOB_BOT_TELEGRAM_TOKEN` ada, auto drop pending + restore webhook job bot)
- `npm run dev:webpack` menjalankan server development dengan fallback Webpack
- `npm run fresh-start` menghapus cache `.next` sebelum menjalankan `dev`
- `npm run ultra-fresh` memperbaiki cache build yang korup kemudian menjalankan `dev`
- `npm run kill-cache` menghapus cache browser/internal untuk debug UI
- `npm run build` membuat build produksi Next.js dengan pengecekan integritas
- `npm run build:clean` menghapus semua cache secara paksa sebelum build
- `npm run start` menjalankan server hasil build produksi
- `npm run pre-deploy` menjalankan pengecekan sistem (lint, types, audit) sebelum deploy
- `npm run deploy` workflow penuh untuk persiapan deployment (pre-deploy + build)
- `npm test` menjalankan unit tests via Vitest
- `npm run test:watch` unit tests dalam mode interaktif (watch)
- `npm run test:coverage` menghasilkan laporan cakupan kode (test coverage)
- `npm run test:e2e` menjalankan E2E tests via Playwright (headless)
- `npm run test:e2e:ui` menjalankan E2E tests dengan dashboard Playwright UI
- `npm run lint` mengecek kualitas kode menggunakan ESLint
- `npm run clear-cache` menghapus `.next` directory secara aman
- `npm run fix-webpack` memperbaiki error "Webpack cache failure" yang sering muncul
- `npm run ultra-clean` pembersihan total cache dan temporary files
- `npm run audit` menjalankan `scripts/maintenance/audit.ts` untuk audit repo
- `npm run telegram:webhook-info` menampilkan webhook URL + pending updates untuk main bot dan job hunter bot
- `npm run telegram:set-webhook` set webhook kedua bot ke `NEXT_PUBLIC_SITE_URL` (atau `--base=https://...`) dan drop pending update by default
- `npm run telegram:clear-pending` clear pending updates Telegram tanpa break webhook (drop + restore)
- `npm run job-bot:poll` polling job hunter bot di lokal (alternatif webhook untuk dev)

---

## Code Style and Implementation Notes

### TypeScript

- `strict: true`
- `noEmit: true`
- path alias utama: `@/* -> ./src/*`
- target: `ES2017`
- module resolution: `bundler`

### Import Patterns

```ts
import { Button } from '@/components/ui/Button';
import type { AboutData } from '@/types/about';
```

### Component Guidance

- Default ke **Server Component**
- Tambahkan `'use client'` hanya untuk komponen yang memang butuh state/browser API
- Pisahkan logika besar ke hooks/utilities bila komponen OS/window mulai terlalu gemuk
- Pertahankan pola folder lokal seperti `_components`, `hooks`, `utils`, `types` bila feature kompleks

### Styling

- Gunakan Tailwind sebagai default
- Gunakan CSS variables untuk theme/runtime values
- Pakai `clsx` dan `tailwind-merge` untuk conditional className
- Untuk styling kompleks atau scoped animation, pakai CSS terpisah hanya jika memang lebih jelas
- CSS terpisah ada di `src/styles/` (animations, layout-utilities) dan `src/app/globals.css`

### Framework-Specific Notes

- Repo ini memakai **`src/proxy.ts`**, bukan `middleware.ts`
- `next.config.mjs` mengaktifkan `reactCompiler: true` dan `reactStrictMode: true`
- `next.config.mjs` juga mengatur:
  - `allowedDevOrigins` untuk dev CORS
  - `compress: true`
  - Image optimization (AVIF + WebP, long cache TTL)
  - `experimental.optimizeCss` (critical CSS inlining dengan `critters`)
  - `experimental.optimisticClientCache` dan `scrollRestoration`
  - `experimental.optimizePackageImports` untuk tree-shaking
  - `turbopack: {}` config section
  - `compiler.removeConsole` di production
  - `productionBrowserSourceMaps: false`
  - `poweredByHeader: false`, `generateEtags: true`
  - Redirects, rewrites, security headers, dan cache headers

---

## State Management & Contexts

### Root Contexts (`src/contexts/`)

| Context                   | Kegunaan                      |
| ------------------------- | ----------------------------- |
| `LanguageContext`         | i18n language switching       |
| `LastUpdatedContext`      | Track last updated timestamps |
| `ModalContext`            | Modal state management        |
| `NavbarVisibilityContext` | Navbar show/hide state        |
| `ToastContext`            | Toast notification system     |
| `WindowContext`           | Window management state       |

### OS-Level Contexts (`src/components/os/`)

- `DesktopWindowContext` — window registry untuk desktop
- `UnifiedZIndexContext` — z-index management lintas windows (selector-based subscription)
- `OSSystemContext` — state sistem OS global (start screen, notes visibility, spotlight, dll.)
- `LayoutPersistenceContext` — persist desktop layout state

> **Pattern — UnifiedZIndex consumer**
>
> - `useUnifiedZIndex()` — subscribe ke perubahan global; pakai ini kalau komponen render berdasarkan zIndex banyak id sekaligus (mis. `UnifiedLayer`).
> - `useZIndexFor(id)` — subscribe **hanya** ke perubahan zIndex `id` spesifik; pakai di leaf component (mis. `DraggableStickyNote`).
> - `useUnifiedZIndexActions()` — tanpa subscription, hanya expose mutator (`bringToFront`, `registerElement`, dll.); pakai kalau komponen tidak render berdasarkan zIndex.

### Custom Hooks (`src/hooks/`)

| Hook                 | Kegunaan                                                    |
| -------------------- | ----------------------------------------------------------- |
| `useAdminAuth`       | Admin authentication flow (shared module-level state)       |
| `useAnalytics`       | Analytics tracking                                          |
| `useAutoUpdate`      | Auto-update polling dengan interval                         |
| `useChatSync`        | Real-time chat synchronization                              |
| `useCsrfToken`       | CSRF token yang fresh, sync lintas tab via BroadcastChannel |
| `useImageProtection` | Image right-click protection                                |
| `useNavigation`      | Navigation helpers                                          |
| `useProjectForm`     | Project CRUD form logic                                     |
| `useQuickLook`       | macOS-style Quick Look preview                              |
| `useSystemSound`     | System sound effects                                        |
| `useWindowManager`   | Window management logic                                     |
| `canvas/`            | Canvas-specific hooks (sub-dir)                             |
| `window-manager/`    | Window manager sub-hooks (sub-dir)                          |

---

## Data Architecture and Caching

### Storage Model Saat Ini

1. **Cloudflare D1** adalah backend utama untuk data aplikasi
2. **Cloudflare R2** adalah backend media utama untuk upload gambar/video
3. **`src/data/*.json` dan `src/data/*.ts`** dipakai sebagai fallback, seed, dan sebagian data lokal

### Service Pattern

Sebagian besar content domain menggunakan `ContentService<T>` di `src/lib/services/contentService.ts`.

Contoh:

```ts
import { ContentService } from '@/lib/services/contentService';
import aboutDataFallback from '@/data/about.json';

const service = new ContentService('about.json', aboutDataFallback);
```

Karakteristik `ContentService` saat ini:

- menyimpan data ke Cloudflare D1 key `content/<name>`
- deep-merge D1 data dengan fallback lokal
- memakai `CacheManager` dengan TTL
- menghapus cache sebelum save untuk mencegah stale read
- menambahkan `updatedAt` untuk payload object

### Active Services (`src/lib/services/`)

| Service                      | Domain                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `aboutService.ts`            | About/profile data                                                         |
| `aiChatService.ts`           | AI chat responses                                                          |
| `aiProposalService.ts`       | AI proposal generation                                                     |
| `atsService.ts`              | ATS resume analysis                                                        |
| `contentService.ts`          | Generic content CRUD base (cache-consistent deep-merge, pendingSave queue) |
| `experienceService.ts`       | Work experience data                                                       |
| `explorerService.ts`         | Admin file-explorer virtual (folders + files)                              |
| `galleryFeaturedService.ts`  | Featured gallery items                                                     |
| `hardSkillConceptService.ts` | Skill concept groupings                                                    |
| `hardSkillService.ts`        | Technical skills data                                                      |
| `projectService.ts`          | Project CRUD operations                                                    |
| `realtimeSync.ts`            | Cloudflare D1 polling for lastUpdated                                      |
| `runningTextService.ts`      | Running ticker text                                                        |
| `stickyNotesService.ts`      | Desktop sticky notes                                                       |
| `storageCleanup.ts`          | R2 media cleanup                                                           |
| `testimonialService.ts`      | Testimonial/review data                                                    |
| `project/`                   | Project service sub-modules                                                |

### Key Lib Utilities

| File                   | Kegunaan                               |
| ---------------------- | -------------------------------------- |
| `urlResolver.ts`       | Centralized URL resolution             |
| `seo.ts`               | SEO metadata generation                |
| `api-response.ts`      | Standardized API response helpers      |
| `imageOptimization.ts` | Image optimization utilities           |
| `media.ts`             | Media file handling                    |
| `magic.ts`             | Animation/magic utilities              |
| `chatStore.ts`         | Chat state management                  |
| `constants.ts`         | Shared constants                       |
| `dataRateLimit.ts`     | Cloudflare D1-backed rate limiter      |
| `r2Storage.ts`         | Cloudflare R2 media storage operations |
| `gemini.ts`            | Gemini AI client setup                 |

### Caching Strategy

- **Route ISR:** mayoritas halaman utama memakai `revalidate = 60`
- **React request deduplication:** utilitas di `src/lib/cache.ts`
- **In-memory content cache:** `CacheManager` di `src/lib/cache/CacheManager.ts`
- **API revalidation:** banyak mutation route memanggil `revalidatePath()`

### Content Domains yang Aktif

- about
- projects
- experience
- hard skills
- hard skill concepts
- testimonial
- sticky notes
- running text
- gallery featured
- contact / leads / feedback / settings / metrics
- telegram
- lighthouse-history

### Data Files (`src/data/`)

JSON files: `about.json`, `contact.json`, `experience.json`, `gallery-featured.json`, `hardSkillConcepts.json`, `hardSkills.json`, `leads.json`, `lighthouse-history.json`, `metrics.json`, `projects.json`, `running-text.json`, `settings.json`, `sticky-notes.json`, `telegram.json`, `testimonial.json`

TS files: `fallback-content.ts`, `trailPlaceholders.ts`

---

## Testing

### Unit Tests

- **Runner:** Vitest `^4.0.18`
- **Environment:** `jsdom` (`jsdom` `^28.0.0`)
- **Setup file:** `src/tests/setup.ts`
- **Coverage provider:** `v8`
- **Plugin:** `@vitejs/plugin-react`
- **Server-only mock:** `src/tests/mocks/server-only.ts`

Lokasi test tersebar di:

- `src/lib/__tests__/`
- `src/lib/services/__tests__/`
- `src/components/**/__tests__/`
- route-level tests tertentu di `src/app/**`

### E2E Tests

- **Framework:** Playwright `^1.55.0`
- **Config:** `playwright.config.ts`
- **Test dir:** `tests/e2e`
- **Base URL:** `http://localhost:3000`
- **Browser:** Chromium (Desktop Chrome)

Spec yang ada saat ini:

1. `admin-crud.spec.ts`
2. `admin-reply.spec.ts`
3. `canvas-3d.spec.ts`
4. `crud-flow.spec.ts`
5. `grade-a.spec.ts`
6. `os-core.spec.ts`
7. `realtime-sync.spec.ts`

### E2E Environment

- `ADMIN_PASSWORD` dibutuhkan untuk flow admin tertentu
- `E2E_TEST=true` diset otomatis oleh Playwright `webServer`
- `NEXT_PUBLIC_SITE_URL` juga dioverride ke base URL lokal saat E2E
- `tests/e2e/.auth/` — stored auth state untuk test

---

## Security Notes

### Authentication

- Admin auth berbasis JWT cookie (`admin_token`) via `jsonwebtoken`
- Proxy/auth helper berada di:
  - `src/proxy.ts`
  - `src/middleware/auth.ts`
  - `src/middleware/constants.ts`
  - `src/middleware/utils.ts`

### CSRF

- Mutating request diperiksa oleh `checkCSRF()` dari `src/middleware/csrf.ts`
- Client-side CSRF token handling: `src/lib/security/client-csrf.ts`
- Enforcement terjadi di `src/proxy.ts`

### Rate Limiting

- Rate limiting utama ada di `src/lib/security/rate-limit.ts`
- Cloudflare D1-backed persistent limiter: `src/lib/dataRateLimit.ts`
- Fallback ke in-memory hanya untuk development/testing atau saat CLOUDFLARE_D1 tidak tersedia

### Security Utilities (`src/lib/security/`)

| File              | Kegunaan                      |
| ----------------- | ----------------------------- |
| `rate-limit.ts`   | Rate limiting logic           |
| `sanitization.ts` | Input sanitization            |
| `validation.ts`   | Input validation              |
| `password.ts`     | Password hashing (scrypt)     |
| `token.ts`        | Token generation/verification |
| `request.ts`      | Request security helpers      |
| `client-csrf.ts`  | Client-side CSRF              |
| `types.ts`        | Security type definitions     |
| `utils.ts`        | Security utilities            |

### Security Headers

`next.config.mjs` saat ini mengatur header seperti:

- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Embedder-Policy`
- `X-DNS-Prefetch-Control`
- Resource hints: `Link` preconnect ke fonts.googleapis.com

### Important Reminder

Jika mengubah auth, CSRF, atau route guarding:

1. cek `src/proxy.ts`
2. cek `src/middleware/*` (4 files: auth, csrf, constants, utils)
3. cek route handlers terkait

Jangan membuat `middleware.ts` baru kecuali memang ada perubahan arsitektur yang disengaja.

---

## Environment Variables

`.env.example` adalah referensi utama. Isi aktual saat ini:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_ANALYTICS_ENDPOINT=
NEXT_PUBLIC_ENABLE_WEB_VITALS=
NEXT_PUBLIC_DATA_BACKEND=


CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
CLOUDFLARE_D1_ACCOUNT_ID=
CLOUDFLARE_D1_DATABASE_ID=
CLOUDFLARE_D1_API_TOKEN=
DATA_BACKEND=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_CACHE_PURGE_TOKEN=

ADMIN_PASSWORD_SCRYPT=
JWT_SECRET=
PASSWORD_SALT=
REVALIDATION_TOKEN=
CRON_SECRET=

GEMINI_API_KEY=
GROQ_API_KEY=
GOOGLE_PAGESPEED_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_GROUP_ID=
TELEGRAM_FEEDBACK_THREAD_ID=
ANALYZE=
```

Env aktif/opsional lain yang muncul di codebase:

- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_BASE_URL` — dipakai untuk upload dan serve media dari R2
- `CLOUDFLARE_D1_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_D1_API_TOKEN`, `DATA_BACKEND`, `NEXT_PUBLIC_DATA_BACKEND` — dipakai untuk backend data Cloudflare D1
- `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CACHE_PURGE_TOKEN` — opsional untuk tombol Admin > Clear Cache agar bisa purge Cloudflare CDN/R2 edge cache. Token harus punya permission Zone.Cache Purge.
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- `NEXT_PUBLIC_ENABLE_WEB_VITALS`
- `ANALYZE` — set `true` untuk bundle analyzer
- `VERCEL_URL`
- `GROQ_API_KEY` — optional, untuk `/api/chat/voice` (transcription)
- `TELEGRAM_FEEDBACK_THREAD_ID` — optional, topic Telegram khusus notifikasi feedback
- `CRON_SECRET` — wajib di Vercel agar `/api/cron/telegram-watchdog` bisa
  dipanggil aman oleh external watchdog via header `Authorization: Bearer <CRON_SECRET>`

> **Catatan:** Data aplikasi memakai Cloudflare D1. Media upload/serve memakai Cloudflare R2.

---

## Deployment

### Vercel

`vercel.json` saat ini (tanpa native Vercel Cron karena batasan akun Hobby):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "src/app/api/upload/route.ts": { "maxDuration": 60, "memory": 1024 },
    "src/app/api/cron/telegram-watchdog/route.ts": { "maxDuration": 30 }
  }
}
```

> **Catatan Akun Hobby Vercel:**
> Akun Vercel Hobby dibatasi hanya boleh memiliki cron job harian (maksimal sekali sehari). Oleh karena itu, scheduler `crons` bawaan dihapus dari `vercel.json` agar proses deploy tidak ditolak oleh Vercel.
>
> **Solusi Pemulihan Webhook 5 Menit:**
> Gunakan layanan cron pihak ketiga yang gratis seperti [cron-job.org](https://cron-job.org/) untuk menembak endpoint `/api/cron/telegram-watchdog` setiap 5 menit dengan konfigurasi:
> - **Method**: `GET`
> - **URL**: `https://<domain-anda>.vercel.app/api/cron/telegram-watchdog`
> - **Header**: `Authorization: Bearer <CRON_SECRET>`


### Build / Deploy Notes

- `npm run pre-deploy` menjalankan pengecekan sebelum build production
- image optimization, redirects, rewrites, dan cache headers sudah dikonfigurasi di `next.config.mjs`
- bundle analyzer aktif bila `ANALYZE=true`
- `compiler.removeConsole` otomatis menghapus console.log di production build
- `productionBrowserSourceMaps: false` — source maps tidak diexpose ke client

### Performance Notes

- `@vercel/speed-insights` sudah terpasang di root layout
- custom performance/web-vitals components: `src/components/shared/PerformanceMonitor.tsx`, `src/components/shared/WebVitals.tsx`
- halaman utama dan project pages memakai ISR 60 detik
- critical CSS inlining via `critters` + `experimental.optimizeCss`
- package imports optimized via `experimental.optimizePackageImports`

---

## Common Tasks

### Menambah Page Baru

1. Buat route di `src/app/<route>/page.tsx`
2. Tambahkan `layout.tsx` bila perlu layout khusus
3. Jika route perlu muncul di desktop/dock/navigation, update komponen UI terkait
4. Tambahkan ke `sitemap.ts` bila perlu indexing

### Menambah API Route

1. Buat `src/app/api/<feature>/route.ts`
2. Export method handler (`GET`, `POST`, dll.)
3. Gunakan `src/lib/api-response.ts` untuk standardized response
4. Jika route mutating/protected, review:
   - `src/proxy.ts`
   - `src/middleware/constants.ts`
   - auth/csrf handling di route
5. Tambahkan rate limiting dari `src/lib/security/rate-limit.ts` bila perlu

### Menambah / Mengubah Content Domain

1. Update type di `src/types/`
2. Update fallback JSON/TS di `src/data/`
3. Update service di `src/lib/services/`
4. Tambahkan `revalidatePath()` bila perubahan berdampak ke halaman statis

### Menambah UI OS / Window Baru

1. Mulai dari `src/components/os/`
2. Tentukan apakah masuk `windows/`, `core/`, `sections/`, `layers/`, atau `ui/`
3. Register window di `windowFactory.tsx` (`os/utils/`)
4. Jaga agar komponen interaktif berat tetap client-only dan terisolasi
5. Manfaatkan hooks di `os/hooks/` untuk logika desktop (boot, layout, lock, navigation, dll.)

---

## Troubleshooting

### Build / Dev Issues

```bash
npm run clear-cache
npm run fix-webpack
npm run ultra-clean
npx tsc --noEmit
```

### Cache / Next Issues

```powershell
Remove-Item -Recurse -Force .next
npm run clear-cache
```

### Port / Server Issues

```bash
npx kill-port 3000
npx kill-port 3100
```

### Auth / Cloudflare Issues

- cek env Cloudflare D1/R2 lengkap
- cek `src/lib/cloudflareD1.ts` dan `src/lib/r2Storage.ts`
- cek apakah route error berasal dari proxy/auth/csrf, bukan dari UI

### E2E Issues

- pastikan `ADMIN_PASSWORD` tersedia
- Playwright menggunakan port `3000`
- cek `tests/e2e/.auth/` untuk stored auth state

---

## Additional Notes

### Language

- UI copy dan komentar banyak menggunakan Bahasa Indonesia
- beberapa utilitas/komentar teknis tetap memakai English

### Browser Targets

Mengikuti `browserslist` di `package.json`:

- Chrome >= 90
- Firefox >= 90
- Safari >= 14
- Edge >= 90

### Repo Hygiene

- Gunakan `eslint.config.mjs`, bukan asumsi `.eslintrc`
- Jangan ubah `src/proxy.ts` menjadi `middleware.ts`
- Saat mendokumentasikan repo, prioritaskan kondisi file/config aktual daripada asumsi README lama

### Package Overrides

`package.json` menggunakan `overrides` untuk security fixes:

```json
{
  "@tootallnate/once": "^3.0.1",
  "fast-xml-parser": "^5.5.9",
  "flatted": "^3.3.3",
  "undici": "^7.5.0"
}
```

---

_Last updated: 2026-05-17_
