import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { hardSkillService } from '../../src/lib/services/hardSkillService';
import { aboutService } from '../../src/lib/services/aboutService';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { listR2ObjectKeys, deleteFromR2 } from '../../src/lib/r2Storage';

import { HardSkill } from '../../src/types/hardSkill';

async function confirmPrompt(question: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function fixIconsSync() {
  const hardSkillData = await hardSkillService.getHardSkills(true);
  const aboutData = await aboutService.getAboutData(true);

  const iconRefs: { url: string; storagePath: string | null }[] = [];

  for (const skill of hardSkillData.skills || []) {
    if (skill?.iconUrl) {
      iconRefs.push({
        url: skill.iconUrl,
        storagePath: extractStoragePath(skill.iconUrl),
      });
    }
  }

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
  for (const ref of iconRefs) {
    if (ref.storagePath && ref.storagePath.startsWith('assets/icons-library/')) {
      primaryPathsInPrefix.add(ref.storagePath);
    }
  }

  const r2Keys = await listR2ObjectKeys({ prefix: 'assets/icons-library/' });
  const r2KeySet = new Set(r2Keys);

  const danglingPaths = new Set<string>();
  for (const path of primaryPathsInPrefix) {
    if (!r2KeySet.has(path)) {
      danglingPaths.add(path);
    }
  }

  const orphanKeys: string[] = [];
  for (const key of r2Keys) {
    if (!primaryPathsInPrefix.has(key)) {
      orphanKeys.push(key);
    }
  }

  console.log(`Found ${danglingPaths.size} dangling paths in D1.`);
  console.log(`Found ${orphanKeys.length} orphan keys in R2.`);

  const args = new Set(process.argv.slice(2));
  const skipConfirm = args.has('--yes') || args.has('-y');

  if (orphanKeys.length > 0) {
    console.log('\n--- Orphans ---');
    orphanKeys.forEach((k) => console.log('  - ' + k));
    const ok = skipConfirm || (await confirmPrompt('Delete these orphan files from R2?'));
    if (ok) {
      for (const key of orphanKeys) {
        await deleteFromR2(key);
        console.log(`Deleted ${key}`);
      }
    }
  }

  if (danglingPaths.size > 0) {
    console.log('\n--- Dangling ---');
    Array.from(danglingPaths).forEach((p) => console.log('  - ' + p));
    const ok =
      skipConfirm ||
      (await confirmPrompt('Remove these dangling icons from D1 (hard skills & dock)?'));
    if (ok) {
      // Fix Hard Skills
      let skillsChanged = false;
      const newSkills = (hardSkillData.skills || []).map((skill: HardSkill) => {
        if (skill.iconUrl) {
          const path = extractStoragePath(skill.iconUrl);
          if (path && danglingPaths.has(path)) {
            skillsChanged = true;
            return { ...skill, iconUrl: '' }; // clear iconUrl
          }
        }
        return skill;
      });

      if (skillsChanged) {
        await hardSkillService.saveHardSkills(
          newSkills,
          'Clear dangling icons from D1 (Sync process)'
        );
        console.log('Updated Hard Skills in D1.');
      }

      // Fix Dock
      let dockChanged = false;
      const newDockConfig = { ...dockConfig };
      for (const key of Object.keys(newDockConfig)) {
        const item = newDockConfig[key];
        if (item.iconUrl) {
          const path = extractStoragePath(item.iconUrl);
          if (path && danglingPaths.has(path)) {
            dockChanged = true;
            newDockConfig[key] = { ...item, iconUrl: '' }; // clear iconUrl
          }
        }
      }

      if (dockChanged) {
        await aboutService.updateAboutData({ dockConfig: newDockConfig });
        console.log('Updated Dock Config in D1.');
      }
    }
  }
}

fixIconsSync().catch(console.error);
