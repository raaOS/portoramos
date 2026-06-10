import * as dotenv from 'dotenv';
import path from 'path';
import { listR2ObjectKeys } from '../../src/lib/r2Storage';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const keys = await listR2ObjectKeys({ prefix: 'assets/wallpapers/' });
  console.log('R2 WALLPAPERS KEYS:', JSON.stringify(keys, null, 2));
}

main().catch(console.error);
