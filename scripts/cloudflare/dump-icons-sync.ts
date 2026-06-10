import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { hardSkillService } from '../../src/lib/services/hardSkillService';
import { aboutService } from '../../src/lib/services/aboutService';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { listR2ObjectKeys } from '../../src/lib/r2Storage';

async function checkIconsSync() {
  const iconRefs: { url: string; storagePath: string | null }[] = [];

  const hardSkillData = await hardSkillService.getHardSkills(true);
  for (const skill of hardSkillData.skills || []) {
    if (skill?.iconUrl) {
      iconRefs.push({
        url: skill.iconUrl,
        storagePath: extractStoragePath(skill.iconUrl),
      });
    }
  }

  const aboutData = await aboutService.getAboutData(true);
  const dockConfig = aboutData?.dockConfig || {};
  for (const key of Object.keys(dockConfig)) {
    const item = dockConfig[key];
    if (item?.iconUrl) {
      iconRefs.push({
        url: item.iconUrl,
        storagePath: extractStoragePath(item.iconUrl),
      });
    }
  }

  const primaryPathsInPrefix = new Set<string>();
  const danglingPaths: string[] = [];
  const orphanKeys: string[] = [];

  for (const ref of iconRefs) {
    if (ref.storagePath && ref.storagePath.startsWith('assets/icons-library/')) {
      primaryPathsInPrefix.add(ref.storagePath);
    }
  }

  const r2Keys = await listR2ObjectKeys({ prefix: 'assets/icons-library/' });
  const r2KeySet = new Set(r2Keys);

  for (const path of primaryPathsInPrefix) {
    if (!r2KeySet.has(path)) {
      danglingPaths.push(path);
    }
  }

  for (const key of r2Keys) {
    if (!primaryPathsInPrefix.has(key)) {
      orphanKeys.push(key);
    }
  }

  console.log('--- D1 iconRefs ---');
  iconRefs.forEach((ref) => {
    if (ref.storagePath && ref.storagePath.startsWith('assets/icons-library/')) {
      console.log(
        `${ref.storagePath} -> ${r2KeySet.has(ref.storagePath) ? 'EXISTS in R2' : 'MISSING (Dangling)'}`
      );
    } else {
      console.log(`${ref.url} -> ${ref.storagePath}`);
    }
  });

  console.log('\n--- Dangling Paths (in D1, missing in R2) ---');
  console.log(danglingPaths);

  console.log('\n--- Orphan Keys (in R2, missing in D1) ---');
  console.log(orphanKeys);
}

checkIconsSync().catch(console.error);
