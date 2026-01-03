#!/usr/bin/env node

/**
 * Script untuk setup struktur folder Cloudinary
 * 
 * Script ini akan membantu Anda membuat struktur folder yang terorganisir
 * di Cloudinary Console sesuai dengan halaman website portfolio.
 */

console.log(`
🚀 CLOUDINARY FOLDER STRUCTURE SETUP
====================================

📁 Struktur Folder yang Akan Dibuat:

portfolio/
├── home/               # HomePageEditor - Hero, featured projects, testimonials, stats
│   ├── hero-images/    # Hero background images
│   ├── featured-projects/ # Featured project images
│   ├── testimonials/   # Testimonial images
│   ├── stats/          # Statistics images
│   └── backgrounds/    # Background images
├── about/              # AboutPageEditor - Trail images, gallery mini, profile, skills, swaying gallery
│   ├── trail-images/   # Trail effect images
│   ├── gallery-mini/   # Gallery mini images
│   ├── profile/        # Profile images
│   ├── skills/         # Skills icons
│   ├── swaying-gallery/ # Swaying gallery images
│   └── backgrounds/    # Background images
├── projects/           # ProjectsEditor - Project covers, gallery images
│   ├── project-covers/ # Project cover images
│   ├── gallery-images/ # Project gallery images
│   ├── detail-images/  # Detail images
│   └── thumbnails/     # Thumbnail images
├── content/            # ContentEditor - Navigation, footer, SEO assets
│   ├── navigation/     # Navigation icons
│   ├── footer/         # Footer assets
│   ├── seo/            # SEO images
│   ├── icons/          # General icons
│   └── logos/          # Logo assets
├── effects/            # EffectsEditor - Effect assets, custom CSS
│   ├── effect-assets/  # Effect-related images
│   ├── custom-css/     # CSS-related assets
│   ├── animations/     # Animation assets
│   └── transitions/    # Transition assets
└── shared/             # Assets yang digunakan di multiple halaman
    ├── common/         # Common assets
    ├── ui-elements/    # UI elements
    ├── placeholders/   # Placeholder images
    └── defaults/       # Default images

📝 Langkah-langkah Setup:

1. Buka Cloudinary Console: https://cloudinary.com/console
2. Login ke account Anda
3. Pastikan cloud name: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}
4. Klik "Media Library" di sidebar kiri
5. Klik "Create Folder" untuk setiap folder di bawah ini:

   📂 FOLDER UTAMA:
   - portfolio
   
   📂 SUBFOLDER HOME:
   - portfolio/home
   - portfolio/home/hero-images
   - portfolio/home/featured-projects
   - portfolio/home/testimonials
   - portfolio/home/stats
   - portfolio/home/backgrounds
   
   📂 SUBFOLDER ABOUT:
   - portfolio/about
   - portfolio/about/trail-images
   - portfolio/about/gallery-mini
   - portfolio/about/profile
   - portfolio/about/skills
   - portfolio/about/swaying-gallery
   - portfolio/about/backgrounds
   
   📂 SUBFOLDER PROJECTS:
   - portfolio/projects
   - portfolio/projects/project-covers
   - portfolio/projects/gallery-images
   - portfolio/projects/detail-images
   - portfolio/projects/thumbnails
   
   📂 SUBFOLDER CONTENT:
   - portfolio/content
   - portfolio/content/navigation
   - portfolio/content/footer
   - portfolio/content/seo
   - portfolio/content/icons
   - portfolio/content/logos
   
   📂 SUBFOLDER EFFECTS:
   - portfolio/effects
   - portfolio/effects/effect-assets
   - portfolio/effects/custom-css
   - portfolio/effects/animations
   - portfolio/effects/transitions
   
   📂 SUBFOLDER SHARED:
   - portfolio/shared
   - portfolio/shared/common
   - portfolio/shared/ui-elements
   - portfolio/shared/placeholders
   - portfolio/shared/defaults

6. Setelah semua folder dibuat, test upload dari admin panel

🔧 Environment Variables Check:
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING'}
- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'MISSING'}

✅ Setelah setup selesai, sistem upload akan otomatis mengorganisir file ke folder yang tepat!

📚 Dokumentasi lengkap: CLOUDINARY_FOLDER_STRUCTURE.md
`);

// Test koneksi ke Cloudinary
async function testCloudinaryConnection() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.log('❌ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME tidak ditemukan');
    return;
  }
  
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list.json`);
    if (response.ok) {
      console.log('✅ Koneksi ke Cloudinary berhasil');
    } else {
      console.log('❌ Gagal koneksi ke Cloudinary');
    }
  } catch (error) {
    console.log('❌ Error koneksi:', error.message);
  }
}

// Jalankan test koneksi
testCloudinaryConnection();
