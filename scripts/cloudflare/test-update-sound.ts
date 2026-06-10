import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { aboutService } from '../../src/lib/services/aboutService';

async function testUpdate() {
  console.log('Fetching current about data...');
  const current = await aboutService.getAboutData(true);
  console.log('Current soundConfig.startup:', current.soundConfig?.startup);

  console.log('Updating soundConfig.startup.path to "/sounds/S.wav"...');
  const updated = await aboutService.updateAboutData({
    soundConfig: {
      ...current.soundConfig,
      startup: {
        path: '/sounds/S.wav',
        volume: 0.9,
      },
    },
  });

  console.log('Updated soundConfig.startup:', updated.soundConfig?.startup);

  console.log('Fetching again from DB to verify...');
  const verified = await aboutService.getAboutData(true);
  console.log('Verified soundConfig.startup:', verified.soundConfig?.startup);
}

testUpdate().catch(console.error);
