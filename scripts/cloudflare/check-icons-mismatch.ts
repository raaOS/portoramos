import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { listR2ObjectKeys, buildR2PublicUrl } from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { aboutService } from '../../src/lib/services/aboutService';
import { hardSkillService } from '../../src/lib/services/hardSkillService';

async function main() {
  const [aboutData, hardSkillData] = await Promise.all([
    aboutService.getAboutData(true),
    hardSkillService.getHardSkills(true),
  ]);

  const iconRefs: string[] = [];
  for (const skill of hardSkillData.skills || []) {
    if (skill?.iconUrl) iconRefs.push(skill.iconUrl);
  }

  const dockConfig = aboutData?.dockConfig || {};
  for (const key of Object.keys(dockConfig)) {
    const item = dockConfig[key];
    if (item?.iconUrl) iconRefs.push(item.iconUrl);
  }

  const uniqueRefs = Array.from(new Set(iconRefs));
  console.log('--- D1 REFERENCES (Unique URLs) ---');
  uniqueRefs.forEach((url) => {
    console.log(`- Ref: ${url} (storage: ${extractStoragePath(url)})`);
  });

  const keys = await listR2ObjectKeys({ prefix: 'assets/icons-library/' });
  console.log('\n--- R2 BUCKET FILES ---');
  keys.forEach((key) => {
    console.log(`- Key: ${key} (url: ${buildR2PublicUrl(key)})`);
  });
}

main().catch(console.error);
