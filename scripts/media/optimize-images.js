#!/usr/bin/env node

/**
 * Script untuk optimasi gambar trail effect
 * Menjalankan: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');

const inputDir = 'public/trail-images';
const outputDir = 'public/trail-images-optimized';

// Buat folder output jika belum ada
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📸 Optimizing trail images...');

// List semua file gambar
const files = fs.readdirSync(inputDir).filter(file => 
  file.endsWith('.jpg') || file.endsWith('.jpeg')
);

console.log(`Found ${files.length} images to optimize`);

// Copy dan rename file
files.forEach((file, index) => {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, `${index + 1}.jpg`);
  
  // Copy file
  fs.copyFileSync(inputPath, outputPath);
  
  const stats = fs.statSync(outputPath);
  console.log(`✅ ${file} -> ${index + 1}.jpg (${(stats.size / 1024).toFixed(1)}KB)`);
});

console.log('\n🎉 Image optimization complete!');
console.log(`📁 Optimized images saved to: ${outputDir}`);
console.log('\n📋 Next steps:');
console.log('1. Update your component to use optimized images');
console.log('2. Test the trail effect');
console.log('3. Deploy to Vercel');
