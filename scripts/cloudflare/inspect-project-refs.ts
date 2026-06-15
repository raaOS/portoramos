#!/usr/bin/env tsx
/**
 * Cross-check D1 untuk memastikan tidak ada referensi langsung atau tak
 * langsung (mis. main `.mp4` yang slug-nya kebetulan sama) ke daftar
 * orphan yang akan dihapus dari R2.
 *
 * Pakai aboutService + projectService (bukan getAllD1Values mentah)
 * supaya konsisten dengan view yang dipakai UI.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { aboutService } from '../../src/lib/services/aboutService';
import { projectService } from '../../src/lib/services/projectService';
import { extractProjectAssets } from '../../src/lib/services/project/projectStorage';

const TARGET_BASES = [
  'kampanye-hadiah-digital-liburan',
  'kolase-dunia-ok-terfragmentasi',
  'kolase-lanskap-menanjak',
  'komposisi-kinetik-mengalir',
  'komposit-gerbang-neraka',
  'manipulasi-foto-musik-alam',
  'montase-bunga-cantik',
  'seni-poster-flatiron-neon',
];

async function main() {
  const { projects } = await projectService.getProjects(undefined, true);
  const about = await aboutService.getAboutData(true);

  const haystacks: Array<{ source: string; text: string }> = [];

  // Project URL strings (cover, gallery, comparison, etc.)
  for (const p of projects) {
    const urls = extractProjectAssets(p);
    for (const url of urls) {
      haystacks.push({ source: `project ${p.id} (${p.slug})`, text: url });
    }
  }

  // About hero backgroundTrail src list
  const trail =
    (about?.hero as { backgroundTrail?: Array<{ src?: string; slug?: string }> })
      ?.backgroundTrail || [];
  for (const t of trail) {
    if (t.src) haystacks.push({ source: 'hero.backgroundTrail.src', text: t.src });
    if (t.slug) haystacks.push({ source: 'hero.backgroundTrail.slug', text: t.slug });
  }

  // Wallpaper URLs
  const wallpapers = about?.wallpaperConfig?.collection || [];
  for (const w of wallpapers) {
    if ((w as { url?: string }).url) {
      haystacks.push({ source: 'wallpaperConfig.url', text: (w as { url: string }).url });
    }
    if ((w as { posterUrl?: string }).posterUrl) {
      haystacks.push({
        source: 'wallpaperConfig.posterUrl',
        text: (w as { posterUrl: string }).posterUrl,
      });
    }
  }

  console.log(
    `Scanning ${haystacks.length} URL/slug strings for ${TARGET_BASES.length} bases...\n`
  );

  let hits = 0;
  for (const base of TARGET_BASES) {
    const matches = haystacks.filter((h) => h.text.includes(base));
    if (matches.length > 0) {
      console.log(`HIT: ${base}`);
      for (const m of matches) {
        console.log(`  - ${m.source}: ${m.text}`);
      }
      hits++;
    }
  }

  if (hits === 0) {
    console.log('Tidak ada referensi ke 8 base filename tersebut. Aman untuk dihapus.');
  } else {
    console.log(`\n${hits} base masih dirujuk. JANGAN hapus tanpa review.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
