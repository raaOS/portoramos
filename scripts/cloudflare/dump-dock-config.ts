import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { aboutService } from '../../src/lib/services/aboutService';

async function logDockConfig() {
  const aboutData = await aboutService.getAboutData(true);
  console.log(JSON.stringify(aboutData.dockConfig, null, 2));
}

logDockConfig().catch(console.error);
