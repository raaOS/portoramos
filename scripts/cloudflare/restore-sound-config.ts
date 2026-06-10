import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { aboutService } from '../../src/lib/services/aboutService';

async function restoreSound() {
  console.log('Restoring soundConfig.startup.path to "/sounds/startup.wav"...');
  const current = await aboutService.getAboutData(true);
  await aboutService.updateAboutData({
    soundConfig: {
      ...current.soundConfig,
      startup: {
        path: '/sounds/startup.wav',
        volume: 1,
      },
    },
  });
  console.log('Restored soundConfig successfully.');
}

restoreSound().catch(console.error);
