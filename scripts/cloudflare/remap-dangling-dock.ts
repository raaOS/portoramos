/**
 * Remap Dangling Dock — Perbaiki referensi dock yang mengarah ke item hilang.
 * @module scripts/cloudflare/remap-dangling-dock
 */
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { aboutService } from '../../src/lib/services/aboutService';

async function remapDanglingDock() {
  const aboutData = await aboutService.getAboutData(true);
  const dockConfig = aboutData?.dockConfig || {};

  // List all local icons in public/assets/icons-library/
  const localIconsDir = path.resolve(process.cwd(), 'public/assets/icons-library');
  const files = fs.readdirSync(localIconsDir);

  let changed = false;
  const newDockConfig = { ...dockConfig };

  for (const key of Object.keys(newDockConfig)) {
    const item = newDockConfig[key];
    if (item.iconUrl) {
      const currentFilename = item.iconUrl.split('/').pop() || '';

      // If this file does not exist exactly under the same name, let's find a matching suffix
      const currentSuffixMatch = currentFilename.match(/icnsfile-.*$/);
      if (currentSuffixMatch) {
        const currentSuffix = currentSuffixMatch[0];

        // Find if we have a file with the same suffix in our local/R2 files
        const matchedFile = files.find((f) => f.endsWith(currentSuffix) && !f.endsWith('.icns'));
        if (matchedFile && matchedFile !== currentFilename) {
          const newUrl = `/assets/icons-library/${matchedFile}`;
          console.log(`Remapping dock icon ${key}: ${item.iconUrl} -> ${newUrl}`);
          newDockConfig[key] = {
            ...item,
            iconUrl: newUrl,
          };
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await aboutService.updateAboutData({ dockConfig: newDockConfig });
    console.log('Dock config remapped and updated in D1 database.');
  } else {
    console.log('No dock config remapping needed.');
  }
}

remapDanglingDock().catch(console.error);
