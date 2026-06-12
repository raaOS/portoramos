/**
 * Fix Icons Mismatch — Perbaiki inkonsistensi ikon skill antara D1 dan data lokal.
 * @module scripts/cloudflare/fix-icons-mismatch
 */
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { listR2ObjectKeys } from '../../src/lib/r2Storage';
import { extractStoragePath } from '../../src/lib/urlResolver';
import { aboutService } from '../../src/lib/services/aboutService';
import { hardSkillService } from '../../src/lib/services/hardSkillService';

// Extract basename from storage path (e.g. assets/icons-library/123-icnsfile-abc-finder.webp -> finder)
function getIconBasename(urlOrPath: string): string {
  const filename = urlOrPath.split('/').pop() || '';
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  // Strip timestamps and hash structures common to uploaded icns files
  // For example: 1769438534400-hlte99042ytz-icnsfile-d7ac3a93471d5eaa0d43e730035de6eb-finder-beta-1-pink
  // yields finder-beta-1-pink
  const match = withoutExt.match(/^(?:\d+)-(?:[a-z0-9]+)-icnsfile-(?:[a-f0-9]+)-(.+)$/i);
  if (match) return match[1];

  // Try simpler timestamp pattern
  const simplerMatch = withoutExt.match(/^(?:\d+)-(.+)$/);
  if (simplerMatch) return simplerMatch[1];

  return withoutExt;
}

async function main() {
  console.log('🔄 Memulai pencocokan dan perbaikan icon mismatch...');

  // 1. Dapatkan file-file ikon yang ada di R2
  const r2Keys = await listR2ObjectKeys({ prefix: 'assets/icons-library/' });
  console.log(`📁 Terdeteksi ${r2Keys.length} ikon di R2.`);

  // 2. Ambil data references dari D1
  const aboutData = await aboutService.getAboutData(true);
  const hardSkillData = await hardSkillService.getHardSkills(true);

  let aboutUpdated = false;
  let skillsUpdated = false;

  const r2KeySet = new Set(r2Keys);

  // Helper function to resolve a dangling path to a matching R2 key
  const resolveR2Key = (danglingUrl: string): string | null => {
    const path = extractStoragePath(danglingUrl);
    if (!path) return null;
    if (r2KeySet.has(path)) return path; // File exists, no action needed

    const base = getIconBasename(path);
    console.log(`🔍 Mencari pencocokan untuk dangling path: "${path}" (basename: "${base}")`);

    // Cari key di R2 yang mengandung basename ini
    const match = r2Keys.find((key) => getIconBasename(key) === base || key.includes(base));
    if (match) {
      console.log(`  💡 Ditemukan kecocokan di R2: "${match}"`);
      return match;
    }

    console.log(`  ❌ Tidak ditemukan file pengganti di R2 untuk "${base}"`);
    return null;
  };

  // 3. Periksa dockConfig di about
  if (aboutData?.dockConfig) {
    const dockConfig = aboutData.dockConfig;
    for (const key of Object.keys(dockConfig)) {
      const item = dockConfig[key];
      if (item?.iconUrl) {
        const resolvedKey = resolveR2Key(item.iconUrl);
        if (resolvedKey) {
          const newUrl = `/${resolvedKey}`;
          if (item.iconUrl !== newUrl) {
            console.log(
              `✏️ Mengupdate dockConfig.${key} dari "${item.iconUrl}" menjadi "${newUrl}"`
            );
            item.iconUrl = newUrl;
            aboutUpdated = true;
          }
        }
      }
    }
  }

  // 4. Periksa hardSkillData
  if (hardSkillData?.skills) {
    const skills = hardSkillData.skills;
    for (const skill of skills) {
      if (skill.iconUrl) {
        const resolvedKey = resolveR2Key(skill.iconUrl);
        if (resolvedKey) {
          const newUrl = `/${resolvedKey}`;
          if (skill.iconUrl !== newUrl) {
            console.log(
              `✏️ Mengupdate skill [${skill.name}] dari "${skill.iconUrl}" menjadi "${newUrl}"`
            );
            skill.iconUrl = newUrl;
            skillsUpdated = true;
          }
        }
      }
    }
  }

  // 5. Simpan perubahan jika ada
  if (aboutUpdated) {
    console.log('💾 Menyimpan perubahan dockConfig ke D1...');
    await aboutService.updateAboutData({
      dockConfig: aboutData.dockConfig,
    });
  }

  if (skillsUpdated) {
    console.log('💾 Menyimpan perubahan hardSkills ke D1...');
    await hardSkillService.saveHardSkills(
      hardSkillData.skills,
      'Fix dangling skill icons matching R2'
    );
  }

  if (!aboutUpdated && !skillsUpdated) {
    console.log(
      '✅ Ikon sudah sinkron secara referensi atau tidak ada perubahan yang perlu disimpan.'
    );
  } else {
    console.log('✅ Sinkronisasi ikon selesai!');
  }
}

main().catch(console.error);
