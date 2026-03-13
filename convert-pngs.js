const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertPNGsToWebP() {
  const files = [
    'public/assets/whatsapp-bg.png',
    'public/assets/projects/comparisons/politik-pop-digital-before.png',
    'public/assets/profile/1769442548119-lr39396zt6ul-inspo-copy-image-20260124-010908.png'
  ];

  for (const file of files) {
    try {
      const webpFile = file.replace('.png', '.webp');
      console.log(`Converting ${file} to WebP...`);
      
      await sharp(file)
        .webp({ quality: 85 })
        .toFile(webpFile);
      
      const oldSize = fs.statSync(file).size / (1024 * 1024);
      const newSize = fs.statSync(webpFile).size / (1024 * 1024);
      const saved = ((1 - newSize / oldSize) * 100).toFixed(0);
      
      console.log(`✅ ${file} → ${webpFile} (${oldSize.toFixed(2)}MB → ${newSize.toFixed(2)}MB, ${saved}% reduction)`);
    } catch (error) {
      console.error(`❌ Failed to convert ${file}:`, error.message);
    }
  }
}

convertPNGsToWebP();
