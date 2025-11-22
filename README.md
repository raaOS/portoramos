Portfolio: Masonry + Filter + Shared Element + Admin

Ringkas: Next.js (App Router) + Tailwind + Framer Motion, masonry responsif, transisi shared element, bilingual (IN/EN), upload gambar/video (Cloudinary) via Admin, dan penyimpanan proyek via Upstash (Vercel KV) agar perubahan tersimpan tanpa rebuild.

Fitur Utama
- Header: logo + segmented Explore/Filter; toggle bahasa IN/EN.
- Floating capsule nav: Work / About / Contact.
- Masonry responsif (columns CSS) + autoplay video saat on‑screen (muted, playsInline).
- Admin: tambah/edit/hapus proyek, unggah image/video via Cloudinary.
- Data: Upstash (Vercel KV) untuk penyimpanan; ada fallback ke JSON lokal (`src/data/*.json`) bila KV kosong atau offline.

Struktur Penting
- `src/app` — Halaman App Router (home, explore, filter, works, detail, admin, API).
- `src/components` — Header, FloatingNav, Card, Media, Gallery, PrevNext, Footer, dll.
- `src/lib` — projects (helper), store (Upstash REST), images (proxy helper), i18n.
- API About/Experience/Testimonial/Projects membaca/menulis JSON lokal jika KV tidak tersedia; backup file dibuat sebelum tulis (lihat `src/data`).

Menjalankan
- Dev: `npm run dev`
- Build: `npm run build`

Admin
- Login: set `ADMIN_PASSWORD` di `.env.local`, buka `/admin/login`.
- Panel: `/admin` → tambah proyek (Cover Image/Video + Poster, Galeri URL). Tombol Upload ke Cloudinary tersedia.

Penyimpanan Permanen di Vercel (KV / Upstash)
Admin menyimpan data proyek ke Upstash (Redis via REST) sehingga perubahan tampil langsung tanpa rebuild. Tidak ada DB yang “sleep”.

Environment Variables (lokal & Vercel):

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset`
- `UPSTASH_REDIS_REST_URL=...` (Upstash → Database → REST URL)
- `UPSTASH_REDIS_REST_TOKEN=...` (Upstash → Database → REST TOKEN)
- (opsional) `UPSTASH_REDIS_KEY=portfolio:projects:v1`

Catatan: Explore/Filter/Works membaca `/api/projects` (server fetch ke KV/Upstash), fallback ke JSON bila KV kosong.

Checklist Env Vercel (Production, Preview, Development)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `UPSTASH_REDIS_REST_URL` (tanpa tanda kutip)
- `UPSTASH_REDIS_REST_TOKEN` (tanpa tanda kutip)
- (Opsional) `UPSTASH_REDIS_KEY` (default: `portfolio:projects:v1`)
- Pastikan tidak ada `REDIS_URL` (tidak digunakan)

Catatan
- Gambar/video lewat proxy origin (`/api/img`, `/api/media`) untuk menghindari ORB/CORS; tidak ada 404.
- Explore/Filter/Works membaca `/api/projects` (Upstash bila tersedia, fallback JSON).
- Untuk produksi: gunakan Upstash (Vercel KV) agar perubahan Admin tersimpan permanen.
