#!/usr/bin/env node

/**
 * Script untuk setup struktur folder Cloudinary yang optimal
 * Berdasarkan analisis lengkap frontend dan backend portfolio website
 * 
 * Cara penggunaan:
 * 1. Pastikan environment variables sudah diset
 * 2. Jalankan: node scripts/setup-optimal-cloudinary-folders.mjs
 * 3. Atau: npm run setup:cloudinary
 */

// Cloudinary Setup Script for Optimal Folder Structure
// This script provides instructions and examples for setting up the optimal folder structure

// Configuration will be read from your .env.local file
// Make sure you have:
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret

// This script provides setup instructions for Cloudinary folder structure
// No API calls are made - this is purely informational

// Struktur folder optimal berdasarkan analisis
const OPTIMAL_FOLDER_STRUCTURE = {
  'portfolio': {
    description: 'Root folder untuk semua assets portfolio',
    subfolders: {
      'home': {
        description: 'Home page assets',
        subfolders: {
          'hero': 'Hero section backgrounds',
          'featured': 'Featured project thumbnails', 
          'stats': 'Statistics icons/visuals',
          'testimonials': 'Testimonial avatars',
          'backgrounds': 'General home backgrounds'
        }
      },
      'about': {
        description: 'About page assets',
        subfolders: {
          'trail': 'Background trail images (max 10)',
          'gallery': 'Bio gallery images',
          'profile': 'Profile photos',
          'skills': 'Skill icons',
          'backgrounds': 'About page backgrounds'
        }
      },
      'projects': {
        description: 'Projects-related assets',
        subfolders: {
          'covers': 'Project cover images',
          'gallery': 'Project gallery media (images & videos)',
          'details': 'High-resolution detail images',
          'thumbnails': 'Optimized thumbnails untuk listing',
          'videos': 'Project videos'
        }
      },
      'contact': {
        description: 'Contact page assets',
        subfolders: {
          'icons': 'Contact method icons',
          'backgrounds': 'Contact backgrounds'
        }
      },
      'explore': {
        description: 'Explore page assets',
        subfolders: {
          'thumbnails': 'Grid view thumbnails',
          'filters': 'Category/filter icons',
          'backgrounds': 'Explore backgrounds'
        }
      },
      'ui': {
        description: 'UI elements',
        subfolders: {
          'navigation': 'Navigation icons',
          'footer': 'Footer assets',
          'buttons': 'Button graphics',
          'icons': 'General UI icons',
          'logos': 'Brand logos'
        }
      },
      'seo': {
        description: 'SEO assets',
        subfolders: {
          'og-images': 'Open Graph images',
          'favicons': 'Favicon variations',
          'meta': 'Meta image assets'
        }
      },
      'effects': {
        description: 'Visual effects assets',
        subfolders: {
          'animations': 'Animation elements',
          'transitions': 'Transition assets',
          'particles': 'Particle effects',
          'overlays': 'Overlay graphics'
        }
      },
      'shared': {
        description: 'Shared/common assets',
        subfolders: {
          'placeholders': 'Placeholder images',
          'defaults': 'Default fallback images',
          'patterns': 'Background patterns',
          'textures': 'Texture assets'
        }
      }
    }
  }
}

// Mapping komponen ke folder
const COMPONENT_MAPPING = {
  'HomePageEditor': {
    'Background Image Upload': 'portfolio/home/hero',
    'Featured Projects': 'portfolio/home/featured',
    'Statistics Visuals': 'portfolio/home/stats'
  },
  'AboutEditor': {
    'Trail Images Upload': 'portfolio/about/trail',
    'Bio Gallery Upload': 'portfolio/about/gallery', 
    'Profile Upload': 'portfolio/about/profile'
  },
  'ProjectsEditor': {
    'Cover Upload': 'portfolio/projects/covers',
    'Gallery Upload': 'portfolio/projects/gallery',
    'Detail Images': 'portfolio/projects/details',
    'Video Upload': 'portfolio/projects/videos'
  },
  'ContentEditor': {
    'Navigation Icons': 'portfolio/ui/navigation',
    'Footer Assets': 'portfolio/ui/footer',
    'General Icons': 'portfolio/ui/icons',
    'Logos': 'portfolio/ui/logos'
  },
  'EffectsEditor': {
    'Effect Assets': 'portfolio/effects/animations',
    'Custom Elements': 'portfolio/effects/overlays'
  }
}

// Transformations per folder type
const FOLDER_TRANSFORMATIONS = {
  'thumbnails': 'w_400,h_300,c_fill,f_auto,q_auto',
  'gallery': 'w_1200,h_auto,c_limit,f_auto,q_auto',
  'covers': 'w_800,h_600,c_fill,f_auto,q_auto',
  'trail': 'w_1920,h_1080,c_fill,f_auto,q_auto',
  'profile': 'w_500,h_500,c_fill,f_auto,q_auto,g_face',
  'icons': 'w_64,h_64,c_fit,f_auto,q_auto',
  'hero': 'w_1920,h_1080,c_fill,f_auto,q_auto',
  'og-images': 'w_1200,h_630,c_fill,f_auto,q_auto'
}

function generateFolderList(structure, prefix = '') {
  const folders = []
  
  for (const [key, value] of Object.entries(structure)) {
    const currentPath = prefix ? `${prefix}/${key}` : key
    folders.push({
      path: currentPath,
      description: value.description || value
    })
    
    if (value.subfolders) {
      folders.push(...generateFolderList(value.subfolders, currentPath))
    }
  }
  
  return folders
}

function displaySetupInstructions() {
  console.log(`
🚀 CLOUDINARY OPTIMAL FOLDER STRUCTURE SETUP
${'='.repeat(50)}
`)
  
  console.log(`📋 Setup Instructions:`)
  console.log(`- Make sure you have Cloudinary account setup`)
  console.log(`- Configure your .env.local with Cloudinary credentials`)
  console.log(`- Use this guide to create the optimal folder structure\n`)
  
  console.log(`🎯 Berdasarkan analisis lengkap frontend dan backend:`)
  console.log(`   ✅ Home Page: Hero, Featured Projects, Stats, Testimonials`)
  console.log(`   ✅ About Page: Trail Images, Gallery, Profile, Skills`)
  console.log(`   ✅ Projects: Covers, Gallery, Details, Videos, Thumbnails`)
  console.log(`   ✅ Contact: Icons, Backgrounds`)
  console.log(`   ✅ Explore: Thumbnails, Filters`)
  console.log(`   ✅ UI: Navigation, Footer, Icons, Logos`)
  console.log(`   ✅ SEO: OG Images, Favicons, Meta`)
  console.log(`   ✅ Effects: Animations, Transitions, Overlays`)
  console.log(`   ✅ Shared: Placeholders, Defaults, Patterns\n`)
  
  return true
}

function displayFolderStructure() {
  const folders = generateFolderList(OPTIMAL_FOLDER_STRUCTURE)
  
  console.log(`📁 STRUKTUR FOLDER OPTIMAL (${folders.length} folders):\n`)
  
  folders.forEach(folder => {
    const indent = '  '.repeat((folder.path.split('/').length - 1))
    const icon = folder.path.includes('/') ? '├──' : '📂'
    console.log(`${indent}${icon} ${folder.path.split('/').pop()}/`)
    if (typeof folder.description === 'string') {
      console.log(`${indent}    # ${folder.description}`)
    }
  })
  
  console.log()
}

function displayComponentMapping() {
  console.log(`🎨 MAPPING KOMPONEN ADMIN → FOLDER:\n`)
  
  Object.entries(COMPONENT_MAPPING).forEach(([component, mappings]) => {
    console.log(`📝 ${component}:`)
    Object.entries(mappings).forEach(([action, folder]) => {
      console.log(`   • ${action} → ${folder}/`)
    })
    console.log()
  })
}

function displayTransformations() {
  console.log(`⚡ TRANSFORMATIONS PER FOLDER TYPE:\n`)
  
  Object.entries(FOLDER_TRANSFORMATIONS).forEach(([type, transform]) => {
    console.log(`📐 ${type}: ${transform}`)
  })
  
  console.log()
}

function displayManualSetupSteps() {
  const folders = generateFolderList(OPTIMAL_FOLDER_STRUCTURE)
  
  console.log(`📝 LANGKAH SETUP MANUAL:\n`)
  console.log(`1. Buka Cloudinary Console: https://console.cloudinary.com/`)
  console.log(`2. Login ke account Cloudinary Anda`)
  console.log(`3. Klik "Media Library" di sidebar kiri`)
  console.log(`4. Klik "Create Folder" untuk setiap folder berikut:\n`)
  
  folders.forEach((folder, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${folder.path}`)
  })
  
  console.log(`\n5. Setup Upload Preset:`)
  console.log(`   - Preset Name: portfolio_upload`)
  console.log(`   - Signing Mode: Unsigned`)
  console.log(`   - Folder: portfolio`)
  console.log(`   - Transformation: f_auto,q_auto,w_1920,h_auto,c_limit`)
  console.log(`   - Allowed Formats: jpg,png,webp,gif,mp4,mov`)
  console.log(`   - Max File Size: 10MB\n`)
}

function displayTestInstructions() {
  console.log(`🧪 TEST UPLOAD SETELAH SETUP:\n`)
  console.log(`1. Restart development server: npm run dev`)
  console.log(`2. Buka admin panel: http://localhost:3000/admin`)
  console.log(`3. Test upload di setiap editor:`)
  console.log(`   • HomePageEditor → Background Image`)
  console.log(`   • AboutEditor → Trail Images`)
  console.log(`   • ProjectsEditor → Cover & Gallery`)
  console.log(`   • ContentEditor → Icons & Logos\n`)
}

function displayMigrationPlan() {
  console.log(`🔄 MIGRATION PLAN:\n`)
  console.log(`Phase 1: Setup Folder Structure`)
  console.log(`  ✅ Buat semua folder di Cloudinary Console`)
  console.log(`  ✅ Update upload preset configuration`)
  console.log(`  ✅ Test upload dari admin panel\n`)
  
  console.log(`Phase 2: Migrate Existing Assets`)
  console.log(`  📥 Download existing assets`)
  console.log(`  📤 Re-upload ke folder structure baru`)
  console.log(`  🔄 Update database references\n`)
  
  console.log(`Phase 3: Update Code`)
  console.log(`  📝 Update cloudinaryFolders.ts helper`)
  console.log(`  🔧 Update upload components`)
  console.log(`  🌐 Update API routes\n`)
  
  console.log(`Phase 4: Cleanup`)
  console.log(`  🗑️  Remove old folder structure`)
  console.log(`  📚 Update documentation`)
  console.log(`  ⚡ Performance testing\n`)
}

function main() {
  if (!displaySetupInstructions()) {
    process.exit(1)
  }
  
  displayFolderStructure()
  displayComponentMapping()
  displayTransformations()
  displayManualSetupSteps()
  displayTestInstructions()
  displayMigrationPlan()
  
  console.log(`✨ KEUNTUNGAN STRUKTUR BARU:\n`)
  console.log(`   🎯 Organisasi yang jelas berdasarkan halaman dan fungsi`)
  console.log(`   ⚡ Optimasi performance dengan transformasi otomatis`)
  console.log(`   📈 Scalability untuk pengembangan future`)
  console.log(`   🔍 SEO friendly dengan folder terpisah`)
  console.log(`   🛠️  Mudah maintenance dan cleanup\n`)
  
  console.log(`📚 Dokumentasi lengkap: CLOUDINARY_FOLDER_STRUCTURE_OPTIMAL.md`)
  console.log(`🔧 Update helper: src/lib/cloudinaryFolders.ts`)
  console.log(`🧪 Test upload: public/test-cloudinary-upload.html\n`)
  
  console.log(`🚀 Setelah setup selesai, sistem upload akan otomatis mengorganisir`)
  console.log(`   file ke folder yang tepat berdasarkan komponen admin yang digunakan!\n`)
}

// Run the script
main()