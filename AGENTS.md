# AGENTS.md - AI Coding Agent Guide

> **Panduan Teknis & Arsitektur Utama untuk AI Coding Agent**  
> Dokumen ini mencerminkan kondisi riil repositori `portfolio-shared` saat ini. Seluruh AI yang bekerja di repositori ini **wajib** mematuhi panduan dan batasan di bawah ini tanpa pengecualian.

---

## 1. Ringkasan Proyek & Arsitektur

**portfolio-shared** adalah portofolio pribadi berbasis **Next.js App Router** dengan pengalaman pengguna utama berupa desktop simulator bergaya macOS. Halaman utama tidak menggunakan navigasi landing page konvensional; pengunjung langsung masuk ke desktop interaktif dengan window system, dock aplikasi, wallpaper dinamis, efek audio, notifikasi Dynamic Island, dan antarmuka obrolan/testimoni bergaya aplikasi pesan.

### Karakteristik Utama

- **Bahasa Utama:** Bahasa Indonesia dengan kamus bahasa Inggris di `src/dictionaries/`.
- **Framework:** Next.js 16.2.x + React 19 dengan React Compiler diaktifkan.
- **Rendering:** Server Components secara default; Client Components digunakan untuk area dengan interaksi berat.
- **Styling:** Tailwind CSS + CSS variables + utility helper `clsx` / `tailwind-merge`.
- **Deployment Target:** Vercel (Hobby Free Tier).
- **Middleware Entry:** Diatur melalui `src/proxy.ts` (bukan `middleware.ts` biasa).
- **Database & Media:** Cloudflare D1 sebagai database relasional utama dan Cloudflare R2 sebagai media bucket storage. SDK dan konfigurasi Firebase telah sepenuhnya dihapus.

---

## 2. Struktur Proyek Aktif

```text
src/
|-- app/                    # App Router routes & API routes
|   |-- @modal/
|   |-- about/
|   |-- (site)/             # Route group untuk homepage & public routes
|   |-- admin/              # Panel administrasi
|   |-- api/                # Endpoint API (32 direktori)
|   |-- lab/                # Eksperimen (saat ini kosong)
|   |-- sw.js/              # Service worker
|   |-- error.tsx
|   |-- fonts.ts            # Definisi font
|   |-- globals.css         # Entry CSS global
|   |-- layout.tsx
|   |-- loading.tsx
|   `-- proxy.ts            # Request interception pipeline (entry point)
|-- components/
|   |-- admin/              # Komponen khusus halaman admin
|   |-- canvas/             # Tampilan 3D / infinite canvas / project view
|   |-- chat/               # Komponen obrolan / messaging
|   |-- error/
|   |-- features/
|   |-- home/
|   |-- layout/             # MasonryGrid, SmoothScroll, dll.
|   |-- os/                 # Implementasi utama desktop environment
|   |-- projects/
|   |-- shared/             # PerformanceMonitor, dll.
|   `-- ui/                 # Reusable UI components
|-- constants/              # Data konstan statis (misal: skillIcons.tsx)
|-- contexts/               # Root-level React Context Providers (6 file)
|-- data/                   # Fallback data JSON dan statis seed
|-- dictionaries/           # Kamus lokalisasi multi-bahasa
|-- hooks/                  # Custom React hooks umum (window size, event listeners, dll.)
|-- lib/                    # Core library, services, & utilities
|-- middleware/             # Sub-middleware untuk auth, csrf, dll.
|-- types/                  # Definisi tipe TypeScript granular (tanpa barrel file)
|-- utils/                  # Helper utilitas general (cropImage, dll.)
```

### Detail Desktop Simulator (`src/components/os/`)

- **`context/`**: State global desktop (`OSSystemContext`, `DesktopWindowContext`, `UnifiedZIndexContext`).
- **`core/`**: Komponen utama shell desktop (`DesktopEnvironment`, `Dock`, `MenuBar`, `Spotlight`).
- **`hooks/`**: Custom hooks visual simulator (`useWindowManager`, `useSystemSound`, `useQuickLook`, dan folder `window-manager/`).
- **`layers/`**: Lapisan UI (`DesktopIconsLayer`, `UIOverlaysLayer`, `UnifiedLayer`).
- **`sections/`**: Konten tab About (`AboutTab`, `CVTab`, `InterestsTab`, `PhilosophyTab`).
- **`windows/`**: Komponen window simulator (`Window`, `ChatWindow`, `ContactWindow`, `ExplorerWindow`, dll.).

---

## 3. Batasan Refaktorisasi (Refactoring Restrictions)

> [!IMPORTANT]
> Beberapa file di bawah ini memiliki tingkat kompleksitas visual, efek animasi, alur state, atau integrasi eksternal yang sangat tinggi. **Jangan memecah atau melakukan refaktor modularisasi** pada file-file ini kecuali diperintah langsung oleh pengguna atau untuk memperbaiki bug spesifik. Pemecahan file secara agresif berisiko merusak sinkronisasi frame, menurunkan frame rate, atau memutuskan rantai callback.

| #   | File Path                                                 | Peran & Kompleksitas                                                                                                      | Risiko jika Direfaktor                                                                                 |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | `src/components/os/core/Dock.tsx`                         | Menu Dock bawah; hover scaling fisika ikon, bounce animation, context menus, SoundManager, drag-and-drop `@dnd-kit/core`. | Merusak tracking kursor real-time, mengganggu timing bounce, memicu _infinite re-renders_.             |
| 2   | `src/components/os/windows/Window.tsx`                    | Bingkai jendela aplikasi macOS; dragging, resizing, minimize/maximize animations, z-index focus stacking.                 | Merusak referensi DOM (`useRef`), z-index terputus, animasi transisi minimize menjadi patah.           |
| 3   | `src/components/os/context/OSSystemContext.tsx`           | State global OS virtual (Spotlight, Control Center, Mission Control, volume, kecerahan, sticky notes).                    | Desinkronisasi state rendering antara Dock, MenuBar, dan Window; overhead boilerplate berlebih.        |
| 4   | `src/app/api/webhook/telegram/route.ts`                   | Webhook Telegram callback (CS bot & Job hunter bot); pemisahan thread ID, inline buttons, local dev server heartbeat.     | Kegagalan parsing payload Telegram API, request timeout, terganggunya koordinasi lease dev server.     |
| 5   | `src/app/api/admin/login/route.ts`                        | Endpoint login admin dan logging keamanan; audit, IP geolocation, geocoding maps, notifikasi Telegram.                    | Kegagalan dependency-import antara Edge vs Node runtime Vercel, memperlambat cold-start.               |
| 6   | `src/components/os/core/DesktopEnvironment.tsx`           | Entry point desktop; koordinasi posisi window, drag boundaries, grid shortcut ikon, wallpaper transitions.                | Merusak drag boundaries, bug penumpukan window, atau glitch animasi transisi wallpaper.                |
| 7   | `src/app/admin/projects/explorer/AdminExplorerClient.tsx` | File explorer virtual admin; grid direktori, drag-and-drop `@dnd-kit/core`, antrean upload R2, action sheets.             | Mengacaukan sinkronisasi drop-zones, merusak progres upload real-time, mematahkan navigasi breadcrumb. |
| 8   | `src/app/admin/system/components/WallpaperManager.tsx`    | Dashboard admin wallpaper; upload direct-to-R2, kompresi WASM FFmpeg di client, aspek rasio asinkron, backfill poster.    | Kebocoran memori (memory leak) WASM FFmpeg, antrean upload rusak, kegagalan pembuatan poster JPG.      |
| 9   | `src/app/api/admin/upload/route.ts`                       | API upload media; multipart parsing di edge runtime, validation size, kompresi ffmpeg, sharp image resizing.              | Upload file besar timeout, kegagalan optimasi gambar (.webp/.avif) secara acak.                        |
| 10  | `src/components/admin/about/DesignPhilosophyForm.tsx`     | Form filosofi desain; nested arrays dengan React Hook Form, skema validasi Zod bersarang, sinkronisasi D1.                | Kerusakan jalur validasi Zod (validation path), input kehilangan fokus saat mengetik.                  |
| 11  | `src/contexts/BackgroundUploadContext.tsx`                | State upload wallpaper background; serialisasi antrean kompresi `compressChainRef`, progress tracking di menubar.         | Concurrency conflict (race condition) pada thread WASM FFmpeg, video korup sewaktu kompresi.           |
| 12  | `src/lib/jobBot/handler.ts`                               | Logika bot Telegram Job Hunter; scraper situs loker (Glints/Jobstreet), parser HTML/API, inline buttons router.           | Putusnya rantai callback Telegram API, kegagalan rate-limiting, kerusakan format teks pesan Telegram.  |
| 13  | `src/components/os/windows/ExplorerWindow/index.tsx`      | Finder/Explorer simulator client; render pohon direktori virtual, double-click gestures, Quick Look modal (PDF/Markdown). | Traversal folder melambat, double-click gesture macet, rendering ikon berkas rusak.                    |
| 14  | `src/lib/services/explorerService.ts`                     | Layanan tree virtual file system (D1 & R2); SQL parent-child, copy/delete atomik R2, TOCTOU guard.                        | Kehilangan referensi file virtual (dangling files) atau terhapusnya media asli R2 secara permanen.     |
| 15  | `src/components/canvas/InfiniteCanvasView.tsx`            | Galeri 3D proyek interaktif; Three.js / React Three Fiber setup, custom shaders, orbital camera limits, render loop.      | WebGL context lost, lag parah karena alokasi ulang objek 3D di setiap render, camera jittering.        |

---

## 4. Technology Stack & Dependencies

### Core Stack

- **Next.js:** `^16.2.1` (App Router, Custom `proxy.ts`, React Compiler enabled).
- **React:** `^19.2.1` (React 19).
- **TypeScript:** `^5.4.5` (`strict: true`, target `ES2017`).
- **Tailwind CSS:** `^3.4.7` (Utility-first styling).

### Pustaka Penting (Dependencies Key)

- **Animasi:** `motion` (`^12.38.0`), `lottie-react`.
- **Navigasi & Scroll:** `lenis`, `@dnd-kit/core` (drag and drop), `next-view-transitions` (`^0.3.5`).
- **State / Fetching:** `@tanstack/react-query`, `swr`.
- **Ikon:** `lucide-react`, `@tabler/icons-react`.
- **Visual 3D:** `three`, `@react-three/fiber`, `@react-three/drei`.
- **Media Processing:** `sharp`, `@ffmpeg/ffmpeg` (WASM), `react-easy-crop`.
- **Format Dokumen:** `html-to-image`, `jspdf`, `jspdf-autotable`, `qrcode.react`.
- **Validasi & Utilitas:** `zod`, `date-fns`, `uuid`, `fuse.js`, `jsonwebtoken`, `jose`.

---

## 5. Keputusan Desain & Konvensi Kode (Design Decisions)

### Efek Visual Desktop

- **Background blur dan scale** hanya diaktifkan untuk window dengan ID yang diawali dengan `project-*` (diatur di `DesktopEnvironment.tsx`).
- Window utilitas biasa (Chat, Contact, About, Mac Folder, Spotlight) **sengaja tidak** memicu efek blur agar interaksi terasa ringan dan tidak membebangi rendering browser.

### Arsitektur D1 Database Path Semantics

- `db.ref(path)` memparse pemisah `/` sebagai objek bersarang (_nested object_) dalam baris tabel `content`.
- `db.ref('content/about').set(x)` menulis ke **tabel `content` dengan kolom field `about = x`**.
- `getD1Value('content/about')` mencari baris dengan key literal `"content/about"`.
- **Aturan:** Jangan mencampur penggunaan layanan content domain (berbasis `db.ref`) dengan helper mentah `getD1Value` / `setD1Value` pada path yang sama untuk menghindari ketidaksesuaian data. Untuk migrasi baris usang, gunakan:
  ```bash
  npx tsx scripts/cloudflare/migrate-legacy-content-rows.ts --apply
  ```

### Konvensi File Media R2 (Side-Car Files)

Setiap pengunggahan video akan menghasilkan tiga file terpisah di bucket R2:

1. `<base>.mp4` — Berkas video utama (dirujuk di D1).
2. `<base>-preview.mp4` — Preview clip (tidak dirujuk langsung di D1, diskip pada wallpaper).
3. `<base>.jpg` — Gambar poster preview (dirujuk langsung di database melalui kolom `posterUrl` pada wallpaper).

> [!WARNING]
> Script pembersihan orphan media (`audit-orphan-*`) dan dashboard status storage telah disesuaikan agar mengenali file side-car ini sebagai referensi valid. Jangan pernah menghapus file pendamping ini secara manual karena akan merusak poster video dan klip preview di client.

---

## 6. Wallpaper & Media Processing Pipeline

### Alur Pengunggahan Wallpaper

1. **Direct-to-R2 (Default):** Melalui `BackgroundUploadContext`. Berkas video berukuran besar dikompresi langsung di sisi client menggunakan WASM FFmpeg sebelum diunggah langsung ke Cloudflare R2 menggunakan _presigned URL_ untuk memintas batas payload Vercel (4.5 MB).
2. **FormData Fallback (`/api/upload`):** Digunakan untuk file kecil (gambar < 30 MB, audio < 25 MB, dan video kecil < 60 MB) seperti gambar poster JPG pendamping.

### Profil Kompresi WASM FFmpeg (Client & Server)

- **Preset Client WASM:** Ditetapkan ke `fast` untuk mengoptimalkan durasi pemrosesan pada thread tunggal di browser.
- **GOP (Group of Pictures):** Ditetapkan ke `60` secara eksplisit guna menghindari efek macroblocking saat video wallpaper diputar berulang (_looping_).
- **CRF (Constant Rate Factor):** Di-tune khusus untuk motion graphics (`CRF=18` untuk kualitas High, `CRF=20` untuk Ultra, dan `CRF=24` untuk Standard).

### Alur Pengiriman & Bandwidth Vercel

Setiap request ke `/r2/<key>` akan diarahkan melalui fungsi serverless Vercel (`src/app/api/r2/[...key]/route.ts`) ke bucket Cloudflare R2.

- Header `cdn-cache-control: public, max-age=31536000, immutable` diatur secara ketat agar Edge Cache Vercel menyimpan berkas video secara permanen dan menghindari pemanggilan fungsi serverless secara berulang yang dapat menghabiskan kuota transfer data.
- Limit durasi fungsi diatur ke `maxDuration: 60` di `vercel.json` untuk mencegah pemutusan koneksi saat melakukan streaming file berukuran besar pada koneksi internet lambat.

---

## 7. State Management & Contexts

### Root Contexts (`src/contexts/`)

- **`LastUpdatedContext`**: Menyimpan timestamp pembaruan database untuk sinkronisasi real-time.
- **`ModalContext`**: Mengatur penayangan modal dialog global.
- **`NavbarVisibilityContext`**: Mengendalikan tampilan menubar atas.
- **`ToastContext`**: Mengelola antrean notifikasi toast.
- **`WindowContext`**: Manajemen status pembukaan dan minimasi jendela OS simulator.
- **`BackgroundUploadContext`**: Antrean kompresi dan unggahan video background di sisi admin.

### OS-Level Contexts (`src/components/os/`)

- **`DesktopWindowContext`**: Registry window OS yang aktif dibuka.
- **`UnifiedZIndexContext`**: Mengelola stack urutan visual window menggunakan selector-based subscription (`useZIndexFor(id)` untuk leaf component, `useUnifiedZIndex()` untuk global layer).
- **`OSSystemContext`**: State sistem global (volume, kecerahan layar, status notes, spotlight search).
- **`LayoutPersistenceContext`**: Menyimpan koordinasi posisi window ke local storage.

---

## 8. Skema Keamanan & Validasi (Security Notes)

### Otentikasi Admin

- Otentikasi admin diamankan menggunakan token JWT (`admin_token`) yang disimpan dalam cookie terenkripsi HTTP-only.
- Filter otentikasi diatur di `src/proxy.ts` dan dievaluasi kembali di file middleware (`src/middleware/auth.ts`).

### Proteksi CSRF

- Setiap request mutasi data (`POST`, `PUT`, `DELETE`) wajib menyertakan header CSRF token yang divalidasi lewat fungsi `checkCSRF()` (`src/middleware/csrf.ts`).
- Sinkronisasi token CSRF antar tab admin dilakukan secara real-time melalui BroadcastChannel (`src/lib/security/client-csrf.ts`).

### Rate Limiting

- Proteksi brute force dikendalikan secara persisten menggunakan database Cloudflare D1 sebagai pencatat rate limit (`src/lib/dataRateLimit.ts`).
- Sistem fallback menggunakan cache memory lokal jika koneksi ke database D1 terputus atau saat menjalankan unit testing.

---

## 9. Perintah Pengembangan & Pengujian

### Perintah Utama (Package Scripts)

```bash
# Inisialisasi Environment Pengembangan
npm run dev               # Menjalankan Next.js dev server & Telegram Job Bot poller
npm run dev -- --no-job-bot # Menjalankan Next.js dev server tanpa Telegram bot lokal
npm run fresh-start       # Menghapus cache build .next lalu menjalankan dev server
npm run ultra-fresh       # Pembersihan cache mendalam lalu menjalankan dev server

# Produksi & Deployment
npm run build             # Membangun aplikasi produksi Next.js
npm run build:clean       # Menghapus cache build Next secara paksa sebelum membangun kembali
npm run start             # Menjalankan aplikasi produksi hasil build secara lokal
npm run pre-deploy        # Verifikasi integritas proyek (lint, types, audit)
npm run deploy            # Workflow deployment lengkap (pre-deploy + build)

# Unit Testing & E2E
npm test                  # Menjalankan unit testing via Vitest
npm run test:watch        # Menjalankan unit testing interaktif (watch mode)
npm run test:coverage     # Menghasilkan laporan cakupan kode (coverage report)
npm run test:e2e          # Menjalankan E2E testing via Playwright (headless)
npm run test:e2e:ui       # Membuka dashboard interaktif Playwright E2E UI

# Pemeliharaan & Pembersihan
npm run lint              # Mengecek kualitas kode menggunakan ESLint 9 Flat Config
npm run clear-cache       # Menghapus direktori cache build .next secara aman
npm run fix-webpack       # Memperbaiki error Webpack cache failure yang sering muncul
npm run ultra-clean       # Menghapus node_modules dan cache secara keseluruhan
npm run audit             # Audit integritas basis data, relasi data, dan file
```

### Integrasi Telegram Bot (Local Development)

Repositori ini mengelola dua bot Telegram secara terpisah:

1. **Main CS Bot (`@WebPortofolioBot`):** Menangani kiriman testimoni, notifikasi login admin, query OTP, dan perintah admin `/ai`.
2. **Job Hunter Bot (`@ramos_job_hunter_bot`):** Menangani pemindaian berkas loker otomatis dengan perintah `/scan` dan `/cek` di dalam topic Job Hunter (`JOB_BOT_THREAD_ID`).

> [!IMPORTANT]
> Saat menjalankan `npm run dev` secara lokal, script orchestrator `scripts/core/dev.js` akan mendeteksi token `JOB_BOT_TELEGRAM_TOKEN` dan otomatis mengaktifkan polling bot Telegram lokal. Polling lokal ini menulis heartbeat lease ke database D1 (`telegramJobBotLocalLease`) agar webhook produksi tidak bentrok dengan server lokal Anda selama proses pengodean. Webhook produksi akan dipulihkan secara otomatis ketika proses dev server dihentikan dengan normal (Ctrl+C).

Manajemen webhook bot dikendalikan melalui CLI demi keamanan:

```bash
# Memeriksa status webhook dan antrean update tertunda pada kedua bot
npm run telegram:webhook-info

# Mengatur webhook kedua bot ke URL Next.js domain produksi
npm run telegram:set-webhook -- --base=https://domain-anda.com

# Membersihkan antrean pesan tertunda (pending updates) secara aman
npm run telegram:clear-pending
```

---

## 10. Konfigurasi Environment & Batasan Quota Vercel

### Konfigurasi Environment Variables (`.env.local`)

Lihat berkas `.env.example` sebagai referensi utama. Beberapa variabel penting meliputi:

- `CLOUDFLARE_D1_DATABASE_ID` & `CLOUDFLARE_D1_API_TOKEN`: Kredensial database Cloudflare D1.
- `CLOUDFLARE_R2_BUCKET` & `CLOUDFLARE_R2_PUBLIC_BASE_URL`: Kredensial media bucket Cloudflare R2.
- `JWT_SECRET` & `PASSWORD_SALT`: Digunakan untuk enkripsi token otentikasi.
- `CRON_SECRET`: Token otentikasi panggilan webhook watchdog oleh cron scheduler.
- `JOB_BOT_TELEGRAM_TOKEN` & `JOB_BOT_ADMIN_CHAT_ID`: Token dan chat ID untuk bot Telegram Job Hunter.
- `JOB_BOT_THREAD_ID` & `JOB_BOT_WEBHOOK_BASE_URL`: ID topik dan base URL untuk webhook Job Hunter.
- `JOB_BOT_USE_AI_APPLY` & `JOB_BOT_USE_AI_ANALYSIS`: Flag pemicu kecerdasan buatan untuk analisis dan lamaran kerja.
- `OPENROUTER_API_KEY`: Kunci API opsional untuk multi-provider AI fallback.
- `NEXT_PUBLIC_DEV_VITALS`: PenampilCore Web Vitals melayang di pojok halaman (khusus development).

### Penyesuaian Penghematan Quota Vercel Hobby (Free Tier)

Guna menjaga agar aplikasi tidak melewati batas kuota bulanan gratis pada Vercel Hobby plan, interval panggilan asinkron di-tune sebagai berikut:

- **`useChatSync` (Polling Obrolan):** Ditetapkan ke **8 detik saat aktif / 60 detik saat background** (menghemat invocations serverless hingga ~60%).
- **`useRealtimeSync` (Polling Versi Data):** Ditetapkan ke **30 detik** (mengurangi konsumsi request D1).
- **Watchdog Cron:** Dijalankan setiap **5 menit** menggunakan cron external di [cron-job.org](https://cron-job.org/) dengan menyertakan header `Authorization: Bearer <CRON_SECRET>`.
- **Transformasi Gambar:** Tag `<Image>` Next.js dikonfigurasi menggunakan transform WebP/AVIF dengan cache jangka panjang. Gunakan atribut `unoptimized` jika gambar berasal dari API eksternal yang sudah teroptimasi.

---

## 11. Workflow Operasional & Pemeliharaan

### Menambah Halaman Baru

1. Buat direktori route di `src/app/<route>/page.tsx`.
2. Jika butuh visual desktop, daftarkan route baru di komponen UI terkait.
3. Daftarkan tautan di `src/app/sitemap.ts` agar di-indeks mesin pencari.

### Menambah Endpoint API Baru

1. Buat berkas route baru di `src/app/api/<nama-endpoint>/route.ts`.
2. Gunakan helper dari `src/lib/api-response.ts` untuk format respon seragam.
3. Jika merupakan endpoint mutasi data, daftarkan path tersebut ke array pengecekan CSRF dan authorization di `src/middleware/constants.ts`.

### Audit dan Sinkronisasi Media R2 dengan Database D1

Admin status popout pada menubar desktop membandingkan jumlah item media di R2 dengan referensi di database D1 secara dinamis (menggunakan endpoint `/api/admin/storage-stats`). Jika terdeteksi ketidakcocokan data, jalankan perintah CLI pemeliharaan di bawah ini:

```bash
# Menampilkan laporan audit ketidakcocokan media wallpaper
npx tsx scripts/cloudflare/audit-orphan-wallpapers.ts

# Menghapus berkas media wallpaper di R2 yang tidak memiliki referensi di D1
npx tsx scripts/cloudflare/audit-orphan-wallpapers.ts --delete-orphans --yes

# Menghapus baris referensi wallpaper di D1 yang berkas R2-nya telah hilang
npx tsx scripts/cloudflare/clear-dangling-wallpapers.ts --yes

# Melakukan backfill URL poster untuk data wallpaper lama (one-time migration)
npx tsx scripts/cloudflare/backfill-wallpaper-poster-urls.ts --apply
```

> [!CAUTION]
> Operasi audit hapus media bersifat destruktif dan tidak memiliki alur undo bawaan. Selalu jalankan perintah di atas tanpa flag `--delete-orphans` terlebih dahulu untuk mempelajari daftar berkas sebelum melakukan penghapusan massal. Script pemeliharaan memiliki safety guard bawaan yang akan menolak penghapusan otomatis jika jumlah berkas yatim (orphan ratio) terdeteksi melebihi 20%.

---

## 12. Troubleshooting & Resolusi Masalah Umum

### Kegagalan Cache Webpack / Next Build

Jika Next.js mengalami error cache kompilasi atau kegagalan modul Webpack, jalankan:

```bash
npm run clear-cache
npm run fix-webpack
```

### Konflik Port Dev Server

Jika port `3000` atau `3100` terdeteksi sedang digunakan oleh proses latar belakang yang menggantung, jalankan perintah ini di shell CLI:

```bash
npx kill-port 3000
npx kill-port 3100
```

### Penanganan Deprecations & Security Overrides

Guna mengunci dependency yang rentan, pastikan kolom `overrides` di file `package.json` tetap terjaga untuk modul-modul berikut:

```json
"overrides": {
  "@tootallnate/once": "^3.0.1",
  "fast-xml-parser": "^5.5.9",
  "flatted": "^3.3.3",
  "undici": "^7.5.0",
  "next": {
    "postcss": "^8.5.14"
  }
}
```

---

_Terakhir Diperbarui: 2026-06-11_
_Tingkat Kepercayaan Informasi: Terverifikasi Penuh oleh Pengujian Unit & Sistem_
