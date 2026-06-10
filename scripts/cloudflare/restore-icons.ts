import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { aboutService } from '../../src/lib/services/aboutService';
import { uploadToR2 } from '../../src/lib/r2Storage';

async function restoreAndUploadIcons() {
  // 1. Upload all local icons to R2
  const localIconsDir = path.resolve(process.cwd(), 'public/assets/icons-library');
  const files = fs.readdirSync(localIconsDir);

  console.log(`Found ${files.length} local icons in ${localIconsDir}.`);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    // Only upload standard images or .icns if needed (but we should upload webp, png, etc.)
    if (['.webp', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      const filePath = path.join(localIconsDir, file);
      const buffer = fs.readFileSync(filePath);
      const key = `assets/icons-library/${file}`;

      let contentType = 'image/png';
      if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      console.log(`Uploading ${file} to R2...`);
      await uploadToR2({
        key,
        body: buffer,
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      });
    }
  }

  // 2. Restore dockConfig in D1
  const aboutData = await aboutService.getAboutData(true);
  const dockConfig = aboutData?.dockConfig || {};

  // Read original dockConfig from src/data/about.json
  const defaultAboutPath = path.resolve(process.cwd(), 'src/data/about.json');
  const defaultAbout = JSON.parse(fs.readFileSync(defaultAboutPath, 'utf-8'));
  const defaultDockConfig = defaultAbout.dockConfig || {};

  let changed = false;
  const newDockConfig = { ...dockConfig };

  for (const key of Object.keys(defaultDockConfig)) {
    const originalItem = defaultDockConfig[key];
    const currentItem = newDockConfig[key] || {};

    if (!currentItem.iconUrl && originalItem.iconUrl) {
      newDockConfig[key] = {
        ...currentItem,
        iconUrl: originalItem.iconUrl,
      };
      changed = true;
      console.log(`Restored dock icon for ${key} -> ${originalItem.iconUrl}`);
    }
  }

  if (changed) {
    await aboutService.updateAboutData({ dockConfig: newDockConfig });
    console.log('Dock config updated in D1 database.');
  } else {
    console.log('No dock config updates needed (already has URLs).');
  }
}

restoreAndUploadIcons().catch(console.error);
