import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables before anything else
config({ path: resolve(process.cwd(), '.env.local') });

import { verifyAdminPassword } from '@/lib/auth';
import { db } from '@/lib/database';

async function testPasswordLogic() {
  console.log('--- STARTING PASSWORD LOGIC TEST ---\n');

  try {
    // 1. Initial State (No DB Password)
    console.log('[Test 1] DB is empty. Checking with .env password...');
    await db.ref('settings/adminPassword').remove();
    
    // We don't know the exact .env password, so we just check if it fails gracefully
    // when given a wrong password, rather than throwing DB errors.
    const isWrongValid = await verifyAdminPassword('WrongPassword123!');
    console.log(`Initial wrong password check: ${isWrongValid === false ? 'Passed' : 'Failed'}`);

    // 2. Set DB Password
    console.log('\n[Test 2] Setting DB password...');
    // We mock a hash for 'DatabasePassword123'
    const { hashPasswordScrypt } = await import('@/lib/auth');
    const salt = process.env.PASSWORD_SALT!;
    const dbHash = hashPasswordScrypt('DatabasePassword123', salt);
    await db.ref('settings/adminPassword').set(dbHash);

    // 3. Verify DB Password overrides
    console.log('\n[Test 3] Verifying DB password is used...');
    const isDbValid = await verifyAdminPassword('DatabasePassword123');
    console.log(`DB Password check: ${isDbValid === true ? 'Passed' : 'Failed'}`);

    // Clean up
    await db.ref('settings/adminPassword').remove();

    console.log('\n--- TESTS COMPLETED ---');
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

testPasswordLogic();
