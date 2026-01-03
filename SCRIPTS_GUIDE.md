# Panduan Folder Scripts

Folder `scripts/` telah dikelompokkan ke dalam subfolder untuk kerapian. Berikut adalah strukturnya:

## � Core (`scripts/core/`)
Script utama untuk aplikasi.
- `dev.js`: Menjalankan development server.

## 🛠️ Utils (`scripts/utils/`)
Utilitas pembersihan dan maintenance cache.
- `clear-cache.js`: Hapus `.next/cache`.
- `fix-webpack-cache.js`: Hapus cache webpack.
- `ultra-clean.js`: Pembersihan total project.
- `kill-browser-cache.js`: Bersihkan cache browser.

## ⚙️ Setup (`scripts/setup/`)
Script untuk inisialisasi layanan pihak ketiga.
- `setup-cloudinary.mjs`: Setup kredensial Cloudinary.
- `setup-cloudinary-folders.mjs`: Setup folder di Cloudinary.

## ⚡ Generators (`scripts/generators/`)
Script untuk generate data dummy dan konten otomatis.
- `generate-password.js`: Buat password admin.
- `magic-*.js`: Generate konten otomatis (caption, comments).
- `seed-testimonials.js`: Isi data testimoni dummy.
- `populate-project-metrics.js`: Isi data analitik dummy.

## 🚀 Deploy (`scripts/deploy/`)
Script terkait deployment.
- `pre-deploy-check.js`: Validasi sebelum deploy.
- `deploy-vercel.mjs`: Utility deploy Vercel manual.

## 🖼️ Media (`scripts/media/`)
Script pengolah media.
- `optimize-images.js`: Optimasi gambar lokal.
- `generate-icons.js`: Generate icons.

## 🧪 Test (`scripts/test/`)
- `run-e2e.js`: Helper untuk menjalankan E2E test.

---

## Cara Menjalankan
Command `npm run` telah diupdate, jadi cara menjalankannya **tetap sama**:
- `npm run dev`
- `npm run ultra-clean`
- `npm run cloudinary:setup`
