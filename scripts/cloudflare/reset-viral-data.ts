#!/usr/bin/env tsx
/**
 * Maintenance Script: Reset Project Likes, Shares, and Clear Comments
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { getD1Value, setD1Value } from '../../src/lib/cloudflareD1';

async function main() {
  console.log('Reading projects from Cloudflare D1...');
  const projects = await getD1Value<Record<string, any>>('projects');

  if (projects) {
    const projectIds = Object.keys(projects);
    console.log(
      `Found ${projectIds.length} projects. Resetting likes, shares, and initialCommentCount...`
    );

    for (const id of projectIds) {
      const p = projects[id];
      console.log(`- Resetting metrics for: "${p.title}" (slug: ${p.slug})`);
      p.likes = 0;
      p.shares = 0;
      p.initialCommentCount = 0;
    }

    await setD1Value('projects', projects);
    console.log('✅ Projects metrics successfully saved to database.');
  } else {
    console.log('⚠️ No projects found in database.');
  }

  console.log('Clearing all comments in D1...');
  await setD1Value('comments', {});
  console.log('✅ Comments cleared.');

  console.log('Updating lastUpdated timestamp to trigger client sync...');
  await setD1Value('lastUpdated', new Date().toISOString());
  console.log('✅ lastUpdated timestamp updated.');

  console.log('🎉 Data cleanup complete!');
}

main().catch((e) => {
  console.error('❌ Failed to reset project metrics:', e);
  process.exit(1);
});
