#!/usr/bin/env node

/**
 * Script untuk setup Cloudinary Upload Preset
 * 
 * Cara penggunaan:
 * 1. Buka Cloudinary Console: https://cloudinary.com/console
 * 2. Login ke account Anda
 * 3. Klik Settings → Upload
 * 4. Scroll ke "Upload presets"
 * 5. Klik "Add upload preset"
 * 6. Isi dengan konfigurasi di bawah ini
 */

console.log(`
🚀 CLOUDINARY UPLOAD PRESET SETUP
==================================

📋 Konfigurasi Upload Preset:

Preset name: portfolio_upload
Signing Mode: Unsigned
Folder: portfolio
Transformation: f_auto,q_auto,w_1920,h_auto,c_limit

📁 Struktur Folder yang Direkomendasikan:

portfolio/
├── projects/           # Halaman proyek
│   ├── trail-images/   # Trail effect images
│   ├── gallery-mini/   # Gallery mini images
│   ├── swing-effect/   # Swing effect images
│   └── project-covers/ # Cover images proyek
├── about/              # Halaman about
│   ├── profile/        # Foto profil
│   ├── skills/         # Skill icons
│   └── trail-images/   # Background trail images
├── contact/            # Halaman kontak
│   └── icons/          # Contact icons
└── shared/             # Assets yang digunakan di multiple halaman
    ├── logos/
    └── common/

📝 Langkah-langkah:

1. Buka: https://cloudinary.com/console
2. Login ke account Anda
3. Klik Settings → Upload
4. Scroll ke "Upload presets"
5. Klik "Add upload preset"
6. Isi form dengan konfigurasi di atas
7. Klik "Save"
8. Buat folder sesuai struktur di atas di Cloudinary Console

🔧 Environment Variables yang sudah ada:
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}
- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'MISSING'}

✅ Setelah upload preset dibuat, sistem upload akan bekerja dengan baik!

🔄 Fallback System:
- Jika Cloudinary gagal, sistem akan otomatis menggunakan local upload
- File akan disimpan di: public/images/trail/
- Image akan di-resize dan di-optimize dengan Sharp

📚 Dokumentasi lengkap: CLOUDINARY_SETUP.md
`);

// Test koneksi ke Cloudinary
async function testCloudinaryConnection() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.log('❌ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME tidak ditemukan di environment variables');
    return;
  }
  
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list/portfolio.json`);
    
    if (response.ok) {
      console.log('✅ Koneksi ke Cloudinary berhasil!');
      const data = await response.json();
      console.log(`📊 Total images di folder portfolio: ${data.resources?.length || 0}`);
    } else {
      console.log('⚠️  Koneksi ke Cloudinary bermasalah. Pastikan cloud name benar.');
    }
  } catch (error) {
    console.log('❌ Error testing Cloudinary connection:', error.message);
  }
}

// Jalankan test jika ada cloud name
if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  testCloudinaryConnection();
}