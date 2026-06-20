import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const TARGET_SLUG = 'desain-sampul-hijau-tua';

// We import the D1 connection directly to query the project ID and verify database status
import { db } from '../../src/lib/database';

async function runSimulation() {
  console.log('--- STARTING END-TO-END VISITOR & ADMIN COMMENT FLOW TEST ---\n');

  // Step 1: Find the target project ID
  console.log('[1] Finding project in database...');
  const projectsSnap = await db.ref('projects').once('value');
  const projects = projectsSnap.val() || {};
  let targetProjectId: string | null = null;
  let targetProjectData: any = null;

  for (const id of Object.keys(projects)) {
    if (projects[id].slug === TARGET_SLUG) {
      targetProjectId = id;
      targetProjectData = projects[id];
      break;
    }
  }

  if (!targetProjectId) {
    console.error(`❌ Project with slug "${TARGET_SLUG}" not found in database.`);
    process.exit(1);
  }

  console.log(`Found project: "${targetProjectData.title}" (ID: ${targetProjectId})`);

  // Step 2: Post comment as a visitor
  console.log('\n[2] Posting a new comment as visitor...');
  const visitorCommentId = `visitor-test-${Date.now()}`;
  const visitorCommentPayload = {
    slug: TARGET_SLUG,
    comment: {
      id: visitorCommentId,
      text: 'Desain sampul yang sangat fresh! (Visitor Comment)',
      name: 'Budi Santoso',
      time: new Date().toISOString(),
    },
    website_url: '',
  };

  const postRes = await fetch(`${BASE_URL}/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitorCommentPayload),
  });

  if (!postRes.ok) {
    console.error('❌ Failed to post visitor comment:', postRes.status, await postRes.text());
    process.exit(1);
  }

  console.log('✅ Visitor comment posted successfully.');

  // Step 3: Verify comment was saved to D1 database
  console.log('\n[3] Verifying comment in database...');
  const commentsSnap = await db.ref(`comments/${TARGET_SLUG}`).once('value');
  const currentComments = commentsSnap.val() || [];

  const foundComment = currentComments.find((c: any) => c.id === visitorCommentId);
  if (!foundComment) {
    console.error('❌ Posted comment not found in database.');
    process.exit(1);
  }

  console.log('✅ Comment found in database:', foundComment);

  // Step 4: Login as admin
  console.log('\n[4] Logging in as admin...');
  const csrfRes = await fetch(`${BASE_URL}/api/admin/login`);
  const csrfData = (await csrfRes.json()) as any;
  const csrfHeaderToken = csrfData.csrfToken;
  const csrfSetCookie = csrfRes.headers.getSetCookie();
  const csrfCookieStr = csrfSetCookie
    ? csrfSetCookie.map((c: string) => c.split(';')[0]).join('; ')
    : '';

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: csrfCookieStr,
      'x-csrf-token': csrfHeaderToken,
    },
    body: JSON.stringify({ password: 'Urgent2025!' }),
  });

  if (!loginRes.ok) {
    console.error('❌ Admin login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const setCookieHeader = loginRes.headers.getSetCookie();
  const adminCookieStr = setCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
  const allCookies = `${csrfCookieStr}; ${adminCookieStr}`;
  const adminHeaders = {
    'Content-Type': 'application/json',
    Cookie: allCookies,
    'x-csrf-token': csrfHeaderToken,
  };

  console.log('✅ Admin login successful.');

  // Step 5: Edit the comment in the list and save (PUT)
  console.log('\n[5] Editing comment as admin...');
  const updatedComments = currentComments.map((c: any) => {
    if (c.id === visitorCommentId) {
      return { ...c, text: 'Desain sampul yang sangat fresh! (Edited by Admin)' };
    }
    return c;
  });

  const editRes = await fetch(`${BASE_URL}/api/projects/${targetProjectId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      id: targetProjectId,
      comments: updatedComments,
    }),
  });

  if (!editRes.ok) {
    console.error('❌ Failed to save edited comment:', editRes.status, await editRes.text());
    process.exit(1);
  }

  console.log('✅ Edit payload saved.');

  // Step 6: Verify edited comment in database
  console.log('\n[6] Verifying edit in database...');
  const editedSnap = await db.ref(`comments/${TARGET_SLUG}`).once('value');
  const editedComments = editedSnap.val() || [];

  const foundEdited = editedComments.find((c: any) => c.id === visitorCommentId);
  if (!foundEdited) {
    console.error('❌ Comment not found after edit.');
    process.exit(1);
  }

  if (foundEdited.text !== 'Desain sampul yang sangat fresh! (Edited by Admin)') {
    console.error('❌ Comment text was not updated correctly in database. Got:', foundEdited.text);
    process.exit(1);
  }

  console.log('✅ Edited text verified in database:', foundEdited.text);

  // Step 7: Delete the comment from the list and save (PUT)
  console.log('\n[7] Deleting comment as admin...');
  const commentsAfterDeletion = editedComments.filter((c: any) => c.id !== visitorCommentId);

  const deleteRes = await fetch(`${BASE_URL}/api/projects/${targetProjectId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      id: targetProjectId,
      comments: commentsAfterDeletion,
    }),
  });

  if (!deleteRes.ok) {
    console.error('❌ Failed to save deleted comment:', deleteRes.status, await deleteRes.text());
    process.exit(1);
  }

  console.log('✅ Deletion payload saved.');

  // Step 8: Verify deletion in database
  console.log('\n[8] Verifying deletion in database...');
  const finalSnap = await db.ref(`comments/${TARGET_SLUG}`).once('value');
  const finalComments = finalSnap.val() || [];

  const foundAfterDelete = finalComments.find((c: any) => c.id === visitorCommentId);
  if (foundAfterDelete) {
    console.error('❌ Comment still exists in database after deletion.');
    process.exit(1);
  }

  console.log('✅ Deletion verified. Comment no longer exists in database.');

  console.log('\n=============================================================');
  console.log('🎉 SUCCESS: Full Lifecycle (Post -> Edit -> Delete) Passed!');
  console.log('=============================================================');
  process.exit(0);
}

runSimulation().catch((err) => {
  console.error('❌ Simulation script failed unexpectedly:', err);
  process.exit(1);
});
